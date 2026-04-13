import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendText } from "@/lib/whatsapp";
import { sendNextQuestion } from "@/lib/qualification";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * POST /api/qualify — Start qualification for a new test lead.
 * Creates the lead in Supabase, sends welcome WA message + first question.
 */
export async function POST(request: Request) {
  try {
    const { name, phone } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
    }

    if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return NextResponse.json({ error: "WhatsApp credentials not configured" }, { status: 500 });
    }

    const phoneHash = crypto.createHash("sha256").update(phone).digest("hex");

    // Check for existing lead with this phone
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("phone_hash", phoneHash)
      .single();

    let leadId: string;

    if (existing) {
      leadId = existing.id;
      // Reset the lead for re-testing
      await supabase.from("leads").update({ status: "qualifying", ai_score: null, ai_verdict: null, ai_summary: null }).eq("id", leadId);
      await supabase.from("wa_sessions").delete().eq("lead_id", leadId);
      await supabase.from("wa_messages").delete().eq("lead_id", leadId);
    } else {
      // Create new lead
      const { data: lead, error: leadErr } = await supabase
        .from("leads")
        .insert({
          status: "qualifying",
          industry: "real_estate",
          source_platform: "manual",
          phone_hash: phoneHash,
        })
        .select("id")
        .single();

      if (leadErr || !lead) {
        return NextResponse.json({ error: "Failed to create lead: " + leadErr?.message }, { status: 500 });
      }
      leadId = lead.id;

      // Create contact
      await supabase.from("lead_contacts").insert({ lead_id: leadId, name, wa_phone: phone });
    }

    // Get qualification config from the first client
    const { data: client } = await supabase
      .from("clients")
      .select("id, qualification_config")
      .limit(1)
      .single();

    const config = client?.qualification_config ?? {
      questions: [
        { key: "interest", text: "What are you looking for?", type: "text" },
        { key: "budget", text: "What's your budget?", type: "buttons", options: ["Under $500k", "$500k-$1M", "$1M+"] },
        { key: "timeline", text: "When do you need this?", type: "buttons", options: ["ASAP", "1-3 months", "Exploring"] },
      ],
      qualify_threshold: 50,
      hot_threshold: 70,
    };

    // Create WA session
    await supabase.from("wa_sessions").upsert({
      lead_id: leadId,
      state: "qualifying",
      collected: {},
      current_step: 0,
      turn_count: 0,
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    });

    // Send welcome message
    const welcomeOk = await sendText(
      phone,
      `Hi ${name}! Thanks for your enquiry. I'm Ava, your AI assistant. Let me ask a few quick questions to match you with the right person.`,
    );

    if (!welcomeOk) {
      return NextResponse.json({ error: "Failed to send WhatsApp message. Is this number whitelisted in your Meta test recipients?" }, { status: 500 });
    }

    // Log welcome message
    await supabase.from("wa_messages").insert({
      lead_id: leadId,
      direction: "outbound",
      sender_type: "ai",
      message_type: "text",
      content: { body: `Hi ${name}! Thanks for your enquiry. I'm Ava, your AI assistant. Let me ask a few quick questions to match you with the right person.` },
    });

    // Small delay then send first question
    await new Promise((r) => setTimeout(r, 1500));
    await sendNextQuestion(phone, config, 0);

    // Log the question
    const q = config.questions[0];
    await supabase.from("wa_messages").insert({
      lead_id: leadId,
      direction: "outbound",
      sender_type: "ai",
      message_type: q.type === "text" ? "text" : q.type === "buttons" ? "interactive_button" : "interactive_list",
      content: { body: q.text },
    });

    // Update session to step 1 (waiting for reply to question 0)
    await supabase.from("wa_sessions").update({ current_step: 1, turn_count: 1 }).eq("lead_id", leadId);

    return NextResponse.json({
      message: `Lead created! Check your WhatsApp — you should receive a welcome message and the first question.`,
      lead_id: leadId,
    });
  } catch (err: unknown) {
    console.error("qualify error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
