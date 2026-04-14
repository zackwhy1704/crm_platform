import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendTemplate } from "@/lib/whatsapp";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * POST /api/qualify
 *
 * Step 1 of the flow: create the lead in Supabase + send hello_world template.
 * The 24hr customer service window only opens AFTER the user replies to the
 * template, so the full qualification (welcome + questions) is triggered from
 * the webhook when we receive the user's first reply.
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

    const phoneForMeta = phone.replace(/^\+/, "");
    const phoneStored = phone.startsWith("+") ? phone : `+${phone}`;
    const phoneHash = crypto.createHash("sha256").update(phoneStored).digest("hex");

    console.log("[qualify] starting for", phoneStored);

    // Check / create lead
    const { data: existing } = await supabase.from("leads").select("id").eq("phone_hash", phoneHash).single();
    let leadId: string;

    if (existing) {
      leadId = existing.id;
      // Reset for re-test
      await supabase.from("leads").update({
        status: "qualifying", ai_score: null, ai_verdict: null, ai_summary: null,
      }).eq("id", leadId);
      await supabase.from("lead_contacts").update({ name, wa_phone: phoneStored }).eq("lead_id", leadId);
      await supabase.from("wa_sessions").delete().eq("lead_id", leadId);
      await supabase.from("wa_messages").delete().eq("lead_id", leadId);
      await supabase.from("lead_form_answers").delete().eq("lead_id", leadId);
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

    // Create WA session in "awaiting_first_reply" state
    await supabase.from("wa_sessions").upsert({
      lead_id: leadId,
      state: "new", // will flip to "qualifying" once user replies
      collected: {},
      current_step: 0,
      turn_count: 0,
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    });

    // Send hello_world template (opens the path for user to reply)
    const tmplResult = await sendTemplate(phoneForMeta, "hello_world");
    if (!tmplResult.ok) {
      return NextResponse.json({
        error: `Meta rejected hello_world template: ${tmplResult.error}. Ensure ${phoneStored} is in your Meta test recipients list.`,
      }, { status: 500 });
    }

    console.log("[qualify] template sent, message id:", tmplResult.messageId);

    await supabase.from("wa_messages").insert({
      lead_id: leadId, direction: "outbound", sender_type: "ai",
      message_type: "text", content: { body: "[hello_world template]" },
    });

    return NextResponse.json({
      message: `✓ Template sent to ${phoneStored}. Please reply "Hi" (or anything) on WhatsApp to start the qualification questions.`,
      lead_id: leadId,
      template_message_id: tmplResult.messageId,
    });
  } catch (err: unknown) {
    console.error("[qualify] error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
