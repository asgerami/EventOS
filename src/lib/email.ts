/**
 * Email sending via Resend.
 * If RESEND_API_KEY is not set, sendTicketEmail no-ops (registration still succeeds).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM ?? "EventOS <onboarding@resend.dev>";
const APP_NAME = process.env.APP_NAME ?? "EventOS";

export type SendTicketEmailParams = {
  to: string;
  attendeeName: string;
  eventName: string;
  ticketUrl: string;
  ticketTypeName: string;
};

export async function sendTicketEmail(params: SendTicketEmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log("[Email] RESEND_API_KEY not set; skipping ticket email to", params.to);
    return false;
  }

  const { to, attendeeName, eventName, ticketUrl, ticketTypeName } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 1.25rem;">Your ticket for ${escapeHtml(eventName)}</h1>
  <p>Hi ${escapeHtml(attendeeName)},</p>
  <p>You're registered for <strong>${escapeHtml(eventName)}</strong> (${escapeHtml(ticketTypeName)}).</p>
  <p>Use the link below to open your ticket and show the QR code at check-in:</p>
  <p style="margin: 24px 0;">
    <a href="${escapeHtml(ticketUrl)}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Open my ticket</a>
  </p>
  <p style="font-size: 0.875rem; color: #666;">Or copy this link: ${escapeHtml(ticketUrl)}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="font-size: 0.75rem; color: #999;">${escapeHtml(APP_NAME)}</p>
</body>
</html>
`.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `Your ticket: ${eventName}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Email] Resend error:", res.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Email] Failed to send:", e);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
