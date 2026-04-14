/**
 * WhatsApp Cloud API helpers — server-side only.
 * Returns { ok, error } so callers can surface real Meta errors.
 */

const GRAPH_API = "https://graph.facebook.com/v21.0";

export type SendResult = { ok: boolean; error?: string; messageId?: string };

function getUrl() {
  return `${GRAPH_API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function doSend(payload: Record<string, unknown>): Promise<SendResult> {
  try {
    const resp = await fetch(getUrl(), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const text = await resp.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { /* not json */ }

    if (resp.ok && data?.messages?.[0]?.id) {
      console.log("[WA] sent ok:", data.messages[0].id);
      return { ok: true, messageId: data.messages[0].id };
    }

    // Meta error shape: { error: { message, code, error_subcode, fbtrace_id, error_user_msg } }
    const errMsg =
      data?.error?.error_user_msg ??
      data?.error?.message ??
      text.slice(0, 300) ??
      `HTTP ${resp.status}`;
    console.error("[WA] send failed:", resp.status, errMsg);
    return { ok: false, error: errMsg };
  } catch (e: any) {
    console.error("[WA] fetch threw:", e?.message);
    return { ok: false, error: e?.message ?? "Network error" };
  }
}

export async function sendText(to: string, body: string): Promise<SendResult> {
  return doSend({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  });
}

export async function sendButtons(
  to: string,
  body: string,
  buttons: { id: string; title: string }[],
): Promise<SendResult> {
  return doSend({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

export async function sendList(
  to: string,
  body: string,
  buttonText: string,
  rows: { id: string; title: string }[],
): Promise<SendResult> {
  return doSend({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: buttonText.slice(0, 20),
        sections: [{ title: "Options", rows: rows.map((r) => ({ id: r.id, title: r.title.slice(0, 24) })) }],
      },
    },
  });
}

/**
 * Send a pre-approved template message. Required for first-contact outside the
 * 24hr customer service window, and for test numbers to initiate conversation.
 */
export async function sendTemplate(to: string, template: string, lang = "en_US"): Promise<SendResult> {
  return doSend({
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: { name: template, language: { code: lang } },
  });
}
