/**
 * WhatsApp Cloud API helpers — server-side only.
 * Sends messages via Meta Graph API v21.
 */

const GRAPH_API = "https://graph.facebook.com/v21.0";

function getUrl() {
  return `${GRAPH_API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function sendText(to: string, body: string): Promise<boolean> {
  const resp = await fetch(getUrl(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });
  if (!resp.ok) {
    console.error("WA send failed:", resp.status, await resp.text().catch(() => ""));
  }
  return resp.ok;
}

export async function sendButtons(
  to: string,
  body: string,
  buttons: { id: string; title: string }[],
): Promise<boolean> {
  const resp = await fetch(getUrl(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
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
    }),
  });
  if (!resp.ok) {
    console.error("WA buttons failed:", resp.status, await resp.text().catch(() => ""));
  }
  return resp.ok;
}

export async function sendList(
  to: string,
  body: string,
  buttonText: string,
  rows: { id: string; title: string }[],
): Promise<boolean> {
  const resp = await fetch(getUrl(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
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
    }),
  });
  if (!resp.ok) {
    console.error("WA list failed:", resp.status, await resp.text().catch(() => ""));
  }
  return resp.ok;
}
