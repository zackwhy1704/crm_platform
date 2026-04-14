import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendText } from "@/lib/whatsapp";
import { sendNextQuestion, computeScore, scoreToVerdict } from "@/lib/qualification";
import { validateAnswer } from "@/lib/claude";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/** GET — webhook verification */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "ok", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/** POST — incoming WA message handler */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const message = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return NextResponse.json({ status: "ok" });

    const from = message.from;
    const phone = from.startsWith("+") ? from : `+${from}`;

    let replyText = "";
    if (message.type === "text") replyText = message.text?.body ?? "";
    else if (message.type === "interactive") {
      if (message.interactive?.type === "button_reply") replyText = message.interactive.button_reply.title ?? "";
      else if (message.interactive?.type === "list_reply") replyText = message.interactive.list_reply.title ?? "";
    }

    if (!replyText) return NextResponse.json({ status: "no_text" });

    console.log(`[webhook] reply from ${phone}: "${replyText}"`);

    // Find lead
    let { data: contact } = await supabase.from("lead_contacts").select("lead_id").eq("wa_phone", phone).single();
    if (!contact) {
      const { data: c2 } = await supabase.from("lead_contacts").select("lead_id").eq("wa_phone", from).single();
      contact = c2;
    }
    if (!contact) {
      console.log("[webhook] no lead for phone:", phone);
      return NextResponse.json({ status: "no_lead" });
    }

    return await processReply(contact.lead_id, from, replyText, message.type);
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

async function processReply(leadId: string, phoneForMeta: string, replyText: string, messageType: string) {
  // Always log the inbound message
  await supabase.from("wa_messages").insert({
    lead_id: leadId, direction: "inbound", sender_type: "lead",
    message_type: messageType === "text" ? "text" : "interactive_button",
    content: { body: replyText },
  });

  const { data: session } = await supabase
    .from("wa_sessions")
    .select("state, current_step, collected")
    .eq("lead_id", leadId)
    .single();

  if (!session || session.state === "complete") {
    return NextResponse.json({ status: "session_complete" });
  }

  const { data: client } = await supabase.from("clients").select("qualification_config").limit(1).single();
  const config = client?.qualification_config ?? {
    questions: [{ key: "interest", text: "What are you looking for?", type: "text" }],
    qualify_threshold: 50, hot_threshold: 70,
  };
  const questions = config.questions ?? [];

  // BRANCH 1: First reply after template — open the flow
  if (session.state === "new") {
    console.log("[webhook] first reply received, starting qualification");

    const { data: contactRow } = await supabase.from("lead_contacts").select("name").eq("lead_id", leadId).single();
    const leadName = contactRow?.name ?? "there";

    // Welcome
    const welcome = `Hi ${leadName}! Thanks for your reply. I'm Ava, your AI assistant. Let me ask a few quick questions to match you with the right person.`;
    const welcomeResult = await sendText(phoneForMeta, welcome);
    if (welcomeResult.ok) {
      await supabase.from("wa_messages").insert({
        lead_id: leadId, direction: "outbound", sender_type: "ai",
        message_type: "text", content: { body: welcome },
      });
    }

    // Small delay, then first question
    await new Promise((r) => setTimeout(r, 500));
    const qResult = await sendNextQuestion(phoneForMeta, config, 0);
    const q = questions[0];
    if (q) {
      await supabase.from("wa_messages").insert({
        lead_id: leadId, direction: "outbound", sender_type: "ai",
        message_type: q.type === "text" ? "text" : q.type === "buttons" ? "interactive_button" : "interactive_list",
        content: { body: q.text },
      });
    }

    await supabase.from("wa_sessions").update({
      state: "qualifying", current_step: 1, turn_count: 1,
      last_activity_at: new Date().toISOString(),
    }).eq("lead_id", leadId);

    if (!qResult.ok) console.error("[webhook] Q1 failed:", qResult.error);
    return NextResponse.json({ status: "qualification_started" });
  }

  // BRANCH 2: Ongoing qualification — user is answering question N
  const prevStep = session.current_step - 1; // step the user just answered
  if (prevStep < 0 || prevStep >= questions.length) {
    return NextResponse.json({ status: "no_question_to_answer" });
  }

  const answeredQuestion = questions[prevStep];
  let finalAnswer = replyText;

  // ReAct GUARDRAIL — runs on EVERY free-text reply, including when the user
  // types instead of tapping a button/list option. Only skipped for genuine
  // interactive taps (button_reply / list_reply) since those are already
  // structured values from WA.
  const isInteractiveTap = messageType === "interactive";

  if (!isInteractiveTap) {
    console.log(`[webhook] validating ${answeredQuestion.type} answer via ReAct:`, replyText);
    const validation = await validateAnswer(
      answeredQuestion.text,
      replyText,
      answeredQuestion.options, // pass options for buttons/list — claude will map free text to one
    );

    if (!validation.valid) {
      console.log("[webhook] answer INVALID, re-asking:", validation.reask);
      await sendText(phoneForMeta, validation.reask);
      await supabase.from("wa_messages").insert({
        lead_id: leadId, direction: "outbound", sender_type: "ai",
        message_type: "text", content: { body: validation.reask },
      });
      // If it's a buttons/list question, re-send the interactive prompt too
      if (answeredQuestion.type !== "text") {
        await new Promise((r) => setTimeout(r, 400));
        await sendNextQuestion(phoneForMeta, config, prevStep);
      }
      await supabase.from("wa_sessions").update({
        last_activity_at: new Date().toISOString(),
      }).eq("lead_id", leadId);
      return NextResponse.json({ status: "reask" });
    }

    finalAnswer = validation.normalised;
    console.log("[webhook] answer valid, normalised to:", finalAnswer);
  }

  // Store the validated answer
  const collected = { ...(session.collected as Record<string, string>), [answeredQuestion.key]: finalAnswer };

  if (session.current_step < questions.length) {
    // Send next question
    const nextStep = session.current_step;
    const qResult = await sendNextQuestion(phoneForMeta, config, nextStep);
    const q = questions[nextStep];

    await supabase.from("wa_messages").insert({
      lead_id: leadId, direction: "outbound", sender_type: "ai",
      message_type: q.type === "text" ? "text" : q.type === "buttons" ? "interactive_button" : "interactive_list",
      content: { body: q.text },
    });

    await supabase.from("wa_sessions").update({
      current_step: nextStep + 1, collected,
      turn_count: (session.current_step ?? 0) + 1,
      last_activity_at: new Date().toISOString(),
    }).eq("lead_id", leadId);

    if (!qResult.ok) console.error("[webhook] next Q failed:", qResult.error);
  } else {
    // All questions answered — compute score and close
    const score = computeScore(collected, config);
    const verdict = scoreToVerdict(score, config);
    const summary = Object.entries(collected).map(([k, v]) => `${k}: ${v}`).join(". ") + ".";

    await supabase.from("leads").update({
      status: verdict, ai_score: score, ai_verdict: verdict, ai_summary: summary,
      qualified_at: new Date().toISOString(),
    }).eq("id", leadId);

    await supabase.from("wa_sessions").update({
      state: "complete", collected, completed_at: new Date().toISOString(),
    }).eq("lead_id", leadId);

    await supabase.from("lead_form_answers").upsert({ lead_id: leadId, answers: collected });

    const closingMsg =
      score >= config.hot_threshold ? "Thanks! You're a great match. Our specialist will reach out to you within the hour."
      : score >= config.qualify_threshold ? "Thanks for your answers! Our team will review and get back to you shortly."
      : "Thanks for sharing! We'll keep you updated with relevant opportunities.";

    await sendText(phoneForMeta, closingMsg);
    await supabase.from("wa_messages").insert({
      lead_id: leadId, direction: "outbound", sender_type: "ai",
      message_type: "text", content: { body: closingMsg },
    });

    console.log(`[webhook] lead ${leadId} qualified: score=${score}, verdict=${verdict}`);
  }

  return NextResponse.json({ status: "processed" });
}
