import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendNextQuestion, computeScore, scoreToVerdict } from "@/lib/qualification";
import { sendText } from "@/lib/whatsapp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * GET /api/wa/webhook — WhatsApp webhook verification (Meta sends this on setup).
 */
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

/**
 * POST /api/wa/webhook — Incoming WhatsApp messages.
 * Extracts the message, looks up the lead, advances the qualification state machine.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Extract message from Meta's nested payload
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      // Could be a status update (delivered, read) — acknowledge
      return NextResponse.json({ status: "ok" });
    }

    const from = message.from; // phone number like "6591234567"
    const phone = from.startsWith("+") ? from : `+${from}`;

    // Extract reply text
    let replyText = "";
    if (message.type === "text") {
      replyText = message.text?.body ?? "";
    } else if (message.type === "interactive") {
      if (message.interactive?.type === "button_reply") {
        replyText = message.interactive.button_reply.title ?? "";
      } else if (message.interactive?.type === "list_reply") {
        replyText = message.interactive.list_reply.title ?? "";
      }
    }

    if (!replyText) {
      return NextResponse.json({ status: "no_text" });
    }

    console.log(`WA reply from ${phone}: "${replyText}"`);

    // Find lead by phone
    const { data: contact } = await supabase
      .from("lead_contacts")
      .select("lead_id")
      .eq("wa_phone", phone)
      .single();

    if (!contact) {
      // Try without + prefix
      const { data: contact2 } = await supabase
        .from("lead_contacts")
        .select("lead_id")
        .eq("wa_phone", from)
        .single();

      if (!contact2) {
        console.log("No lead found for phone:", phone);
        return NextResponse.json({ status: "no_lead" });
      }
      // Fall through with contact2
      return await processReply(contact2.lead_id, phone, replyText);
    }

    return await processReply(contact.lead_id, phone, replyText);
  } catch (err) {
    console.error("WA webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 200 }); // Always 200 to Meta
  }
}

async function processReply(leadId: string, phone: string, replyText: string) {
  // Get session
  const { data: session } = await supabase
    .from("wa_sessions")
    .select("current_step, collected, state")
    .eq("lead_id", leadId)
    .single();

  if (!session || session.state === "complete") {
    return NextResponse.json({ status: "session_complete" });
  }

  // Get qualification config
  const { data: client } = await supabase
    .from("clients")
    .select("qualification_config")
    .limit(1)
    .single();

  const config = client?.qualification_config ?? { questions: [], qualify_threshold: 50, hot_threshold: 70 };
  const questions = config.questions ?? [];

  // Store the reply
  const prevStep = session.current_step - 1; // current_step is the next question to send; prevStep is what they just answered
  const questionKey = prevStep >= 0 && prevStep < questions.length ? questions[prevStep].key : `step_${prevStep}`;
  const collected = { ...(session.collected as Record<string, string>), [questionKey]: replyText };

  // Log inbound message
  await supabase.from("wa_messages").insert({
    lead_id: leadId,
    direction: "inbound",
    sender_type: "lead",
    message_type: "text",
    content: { body: replyText },
  });

  // Check if more questions remain
  if (session.current_step < questions.length) {
    // Send next question
    const nextStep = session.current_step;
    await sendNextQuestion(phone, config, nextStep);

    // Log outbound
    const q = questions[nextStep];
    await supabase.from("wa_messages").insert({
      lead_id: leadId,
      direction: "outbound",
      sender_type: "ai",
      message_type: q.type === "text" ? "text" : q.type === "buttons" ? "interactive_button" : "interactive_list",
      content: { body: q.text },
    });

    // Update session
    await supabase.from("wa_sessions").update({
      current_step: nextStep + 1,
      collected,
      turn_count: (session.current_step ?? 0) + 1,
      last_activity_at: new Date().toISOString(),
    }).eq("lead_id", leadId);
  } else {
    // All questions answered — compute score and close
    const score = computeScore(collected, config);
    const verdict = scoreToVerdict(score, config);

    // Generate summary
    const summaryParts = Object.entries(collected).map(([k, v]) => `${k}: ${v}`);
    const summary = summaryParts.join(". ") + `.`;

    // Update lead
    await supabase.from("leads").update({
      status: verdict,
      ai_score: score,
      ai_verdict: verdict,
      ai_summary: summary,
      qualified_at: new Date().toISOString(),
    }).eq("id", leadId);

    // Update session
    await supabase.from("wa_sessions").update({
      state: "complete",
      collected,
      completed_at: new Date().toISOString(),
    }).eq("lead_id", leadId);

    // Store form answers
    await supabase.from("lead_form_answers").upsert({ lead_id: leadId, answers: collected });

    // Send closing message
    const closingMsg = score >= config.hot_threshold
      ? "Thanks! You're a great match. Our specialist will reach out to you within the hour."
      : score >= config.qualify_threshold
        ? "Thanks for your answers! Our team will review and get back to you shortly."
        : "Thanks for sharing! We'll keep you updated with relevant opportunities.";

    await sendText(phone, closingMsg);
    await supabase.from("wa_messages").insert({
      lead_id: leadId,
      direction: "outbound",
      sender_type: "ai",
      message_type: "text",
      content: { body: closingMsg },
    });

    console.log(`Lead ${leadId} qualified: score=${score} verdict=${verdict}`);
  }

  return NextResponse.json({ status: "processed" });
}
