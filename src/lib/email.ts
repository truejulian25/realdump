const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = "onboarding@resend.dev";

const origin =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.VERCEL_URL ||
  "http://localhost:3000";

export async function sendReactivationEmail(to: string, token: string) {
  const reactivateUrl = `${origin.startsWith("http") ? origin : "https://" + origin}/auth/reactivate?token=${token}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject: "Reactiva tu cuenta",
      html: `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000;padding:40px 16px">
  <tr><td align="center">
    <table width="400" cellpadding="0" cellspacing="0" style="background-color:#18181b;border-radius:12px;overflow:hidden">
      <tr><td style="padding:32px 24px 24px" align="center">
        <h1 style="color:#fff;font-size:22px;margin:0 0 8px">¿Quieres reactivar tu cuenta?</h1>
        <p style="color:#a1a1aa;font-size:14px;margin:0 0 24px;line-height:1.5">
          Haz clic en el botón de abajo para reactivar tu cuenta y recuperar el acceso a tu perfil y contenido.
        </p>
        <a href="${reactivateUrl}" style="display:inline-block;background-color:#2563eb;color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none">Reactivar cuenta</a>
        <p style="color:#52525b;font-size:12px;margin:24px 0 0;line-height:1.4">
          Si no solicitaste esto, ignora este correo.<br>
          Este enlace expira en 7 días.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
      `.trim(),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error (${res.status}): ${body}`);
  }

  return res.json() as Promise<{ id: string }>;
}
