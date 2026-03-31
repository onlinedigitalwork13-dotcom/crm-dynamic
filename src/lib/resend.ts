import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const resend = getResendClient();

  if (!resend) {
    console.warn("Resend not configured — skipping email");
    return;
  }

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "CRM <noreply@yourdomain.com>",
    to,
    subject,
    html,
  });
}

//
// 🔥 EMAIL TEMPLATES (PREMIUM)
//

export function emailTemplate({
  title,
  message,
  actionUrl,
  actionLabel = "Open CRM",
}: {
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; background:#f8fafc; padding:30px;">
      <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:24px; border:1px solid #e2e8f0;">
        
        <h2 style="margin:0 0 10px; color:#0f172a;">${title}</h2>
        
        <p style="margin:0 0 20px; color:#475569; line-height:1.6;">
          ${message}
        </p>

        ${
          actionUrl
            ? `
          <a href="${actionUrl}" 
             style="display:inline-block; padding:10px 16px; background:#0f172a; color:white; border-radius:8px; text-decoration:none; font-size:14px;">
            ${actionLabel}
          </a>
        `
            : ""
        }

        <p style="margin-top:30px; font-size:12px; color:#94a3b8;">
          CRM Dynamic • Automated Notification
        </p>
      </div>
    </div>
  `;
}