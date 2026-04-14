import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendText, sendTemplate } from "@/lib/whatsapp";
import { sendNextQuestion } from "@/lib/qualification";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: Request) {
  try {
    const { name, phone } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
    }

    if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return NextResponse.json({ error: "WhatsApp credentials not configured on server" }, { status: 500 });
    }

    // Meta expects phone without + prefix
    const phoneForMeta = phone.replace(/^\+/, "");
    const phoneStored = phone.startsWith("+") ? phone : `+${phone}`;
    const phoneHash = crypto.createHash("sha256").update(phoneStored).digest("hex");

    console.log("[qualify] Starting for", phoneStored, "(Meta format:", phoneForMeta, ")");

    // Check / create lead
    const { data: existing } = await supabase.from("leads").select("id").eq("phone_hash", phoneHash).single();
    let leadId: string;

    if (existing) {
      leadId = existing.id;
      await supabase.from("leads").update({ status: "qualifying", ai_score: null, ai_verdict: null, ai_summary: null }).eq("id", leadId);
      await supabase.from("wa_sessions").delete().eq("lead_id", leadId);
      await supabase.from("wa_messages").delete().eq("lead_id", leadId);
    } else {
      const { data: lead, error: leadErr } = await supabase
        .from("leads")
        .insert({ status: "qualifying", industry: "real_estate", source_platform: "manual", phone_hash: phoneHash })
        .select("id").single();
      if (leadErr || !lead) {
        return NextResponse.json({ error: "Failed to create lead: " + leadErr?.message }, { status: 500 });
      }
      leadId = lead.id;
      await supabase.from("lead_contacts").insert({ lead_id: leadId, name, wa_phone: phoneStored });
    }

    // Get qualification config
    const { data: client } = await supabase.from("clients").select("id, qualification_config").limit(1).single();
    const config = client?.qualification_config ?? {
      questions: [{ key: "interest", text: "What are you looking for?", type: "text" }],
      qualify_threshold: 50, hot_threshold: 70,
    };

    // Create WA session
    await supabase.from("wa_sessions").upsert({
      lead_id: leadId, state: "qualifying", collected: {}, current_step: 0, turn_count: 0,
      started_at: new Date().toISOString(), last_activity_at: new Date().toISOString(),
    });

    // STEP 1: Send hello_world template (required to open 24hr window for test numbers)
    const tmplResult = await sendTemplate(phoneForMeta, "hello_world");
    if (!tmplResult.ok) {
      console.error("[qualify] template failed:", tmplResult.error);
      return NextResponse.json({
        error: `Meta rejected hello_world template: ${tmplResult.error}. Ensure ${phoneStored} is in the Meta test recipients list (API Setup → To → Manage phone number list).`,
      }, { status: 500 });
    }
    console.log("[qualify] template sent:", tmplResult.messageId);

    await supabase.from("wa_messages").insert({
      lead_id: leadId, direction: "outbound", sender_type: "ai",
      message_type: "text", content: { body: "[hello_world template]" },
    });

    await new Promise((r) => setTimeout(r, 800));

    // STEP 2: Welcome message (free-form)
    const welcome = `Hi ${name}! Thanks for your enquiry. I'm Ava, your AI assistant. Let me ask a few quick questions to match you with the right person.`;
    const welcomeResult = await sendText(phoneForMeta, welcome);

    if (!welcomeResult.ok) {
      return NextResponse.json({
        error: `Welcome message failed: ${welcomeResult.error}. (Template may have gone through but free-form rejected — this usually means the number isn't in test recipients list)`,
      }, { status: 500 });
    }
    console.log("[qualify] welcome sent:", welcomeResult.messageId);

    await supabase.from("wa_messages").insert({
      lead_id: leadId, direction: "outbound", sender_type: "ai",
      message_type: "text", content: { body: welcome },
    });

    // STEP 3: First qualification question
    await new Promise((r) => setTimeout(r, 800));
    await sendNextQuestion(phoneForMeta, config, 0);

    const q = config.questions[0];
    await supabase.from("wa_messages").insert({
      lead_id: leadId, direction: "outbound", sender_type: "ai",
      message_type: q.type === "text" ? "text" : q.type === "buttons" ? "interactive_button" : "interactive_list",
      content: { body: q.text },
    });

    await supabase.from("wa_sessions").update({ current_step: 1, turn_count: 1 }).eq("lead_id", leadId);

    return NextResponse.json({
      message: `✓ 3 messages sent to ${phoneStored}. Check WhatsApp — should see template, welcome, and first question. Reply to continue the flow.`,
      lead_id: leadId,
      template_message_id: tmplResult.messageId,
    });
  } catch (err: unknown) {
    console.error("[qualify] error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
