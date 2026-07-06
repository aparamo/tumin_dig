import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "Túmin Digital <onboarding@resend.dev>";

function getClient() {
  if (!apiKey) {
    throw new Error("Resend no está configurado (falta RESEND_API_KEY).");
  }
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  const resend = getClient();
  const { error } = await resend.emails.send({
    from: emailFrom,
    to: [to],
    subject: "Tu código para recuperar tu NIP — Túmin Digital",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#1a1a1a;">Recuperación de NIP</h2>
        <p>Usa este código para restablecer tu NIP en Túmin Digital. Expira en 10 minutos.</p>
        <p style="font-size: 32px; font-weight: 900; letter-spacing: 8px; text-align: center; padding: 16px; background:#f4f4f4; border-radius: 12px;">${code}</p>
        <p style="color:#666; font-size: 12px;">Si tú no solicitaste este cambio, ignora este correo — tu cuenta sigue segura.</p>
      </div>
    `,
  });
  if (error) {
    throw new Error(`No se pudo enviar el correo: ${error.message}`);
  }
}
