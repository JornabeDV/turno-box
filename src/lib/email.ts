import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(email: string, resetUrl: string, userName?: string) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured, skipping email send");
    return true; // Return true to not break the flow
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Turno box <noreply@bebox.com>",
      to: email,
      subject: "Recupera tu contraseña - Turno box",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recupera tu contraseña</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_URL}/icons/image.png" alt="Turno Box" style="max-width: 150px;">
            </div>

            <h1 style="color: #1a1a1a; text-align: center; margin-bottom: 20px;">Recupera tu contraseña</h1>

            <p>Hola${userName ? ` ${userName}` : ''},</p>

            <p>Hemos recibido una solicitud para resetear tu contraseña. Si no fuiste tú quien realizó esta solicitud, puedes ignorar este email.</p>

            <p>Para crear una nueva contraseña, haz clic en el siguiente enlace:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Resetear contraseña
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              Este enlace expirará en 1 hora por seguridad.
            </p>

            <p style="color: #666; font-size: 14px;">
              Si el botón no funciona, copia y pega esta URL en tu navegador:<br>
              <a href="${resetUrl}" style="color: #f97316;">${resetUrl}</a>
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #666; font-size: 12px; text-align: center;">
              Si tienes problemas o no solicitaste este cambio, contactanos en support@bebox.com
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("[EMAIL ERROR]", error);
      return false;
    }

    console.log("[EMAIL SENT]", data);
    return true;
  } catch (error) {
    console.error("[EMAIL SEND ERROR]", error);
    return false;
  }
}