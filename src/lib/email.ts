import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { MetricsReportPDF } from "@/components/pdf/MetricsReportPDF";
import type { MetricsReport } from "@/lib/queries/metrics";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendWelcomeInvitationEmail(
  email: string,
  resetUrl: string,
  gymName: string,
  userName?: string
) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured, skipping email send");
    return true;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Box Turno <noreply@boxturno.com.ar>",
      to: email,
      subject: `Te damos la bienvenida a ${gymName} — Activá tu cuenta`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Activá tu cuenta</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_URL}/icons/image.png?v=2" alt="Box Turno" style="max-width: 150px;">
            </div>

            <h1 style="color: #1a1a1a; text-align: center; margin-bottom: 20px;">¡Bienvenido a ${gymName}!</h1>

            <p>Hola${userName ? ` ${userName}` : ''},</p>

            <p>Tu gimnasio comenzó a usar <strong>Box Turno</strong> para gestionar reservas de clases. Ya creamos tu cuenta y solo te falta un paso: establecer tu contraseña para empezar a reservar turnos.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Activar mi cuenta
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              Este enlace expirará en 7 días. Si no activás tu cuenta antes, podés pedirle al administrador que te reenvíe la invitación.
            </p>

            <p style="color: #666; font-size: 14px;">
              Si el botón no funciona, copiá y pegá esta URL en tu navegador:<br>
              <a href="${resetUrl}" style="color: #f97316;">${resetUrl}</a>
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #666; font-size: 12px; text-align: center;">
              Si tenés problemas, contactá a la administración de ${gymName}.
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

export async function sendPasswordResetEmail(email: string, resetUrl: string, userName?: string) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured, skipping email send");
    return true;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Box Turno <noreply@boxturno.com.ar>",
      to: email,
      subject: "Recupera tu contraseña - Box Turno",
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
              <img src="${process.env.NEXT_PUBLIC_URL}/icons/image.png?v=2" alt="Box Turno" style="max-width: 150px;">
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
              Si tienes problemas o no solicitaste este cambio, contactanos en support@boxturno.com.ar
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

function kpiRow(label: string, value: string, color: string) {
  return `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #1A4A63; color: #6B8A99; font-size: 14px;">${label}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #1A4A63; color: ${color}; font-size: 18px; font-weight: bold; text-align: right;">${value}</td>
    </tr>
  `;
}

function topList(title: string, items: { name: string; value: string }[]) {
  const rows = items.map((i) => `
    <tr>
      <td style="padding: 8px 16px; color: #EAEAEA; font-size: 13px;">${i.name}</td>
      <td style="padding: 8px 16px; color: #F78837; font-size: 13px; font-weight: bold; text-align: right;">${i.value}</td>
    </tr>
  `).join("");

  return `
    <h3 style="color: #6B8A99; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 24px 0 12px;">${title}</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #0A1F2A; border: 1px solid #1A4A63;">
      ${rows}
    </table>
  `;
}

export async function sendMetricsReportEmail(
  to: string,
  gymName: string,
  report: MetricsReport
) {
  if (!resend) {
    console.error("[EMAIL] RESEND_API_KEY no está configurado. No se puede enviar el reporte.");
    return false;
  }

  try {
    // Generar PDF
    const pdfBuffer = await renderToBuffer(
      MetricsReportPDF({ gymName, report })
    );
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    const { kpis, periodLabel } = report;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reporte de metricas - ${gymName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #EAEAEA; background-color: #0A1F2A; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0E2A38; border: 1px solid #1A4A63; padding: 24px;">
            <h1 style="color: #EAEAEA; font-size: 20px; margin: 0 0 4px;">${gymName}</h1>
            <p style="color: #6B8A99; font-size: 12px; margin: 0 0 24px; text-transform: uppercase; letter-spacing: 0.1em;">Reporte ${periodLabel}</p>

            <p style="color: #EAEAEA; font-size: 14px; margin: 0 0 16px;">
              Adjunto encontraras el reporte completo con las metricas del periodo.
            </p>

            <div style="background: #0A1F2A; border: 1px solid #1A4A63; padding: 16px; margin-bottom: 24px;">
              <p style="color: #6B8A99; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px;">Resumen rapido</p>
              <p style="color: #EAEAEA; font-size: 14px; margin: 4px 0;"><strong>Reservas:</strong> ${kpis.totalBookings}</p>
              <p style="color: #EAEAEA; font-size: 14px; margin: 4px 0;"><strong>Ocupacion:</strong> ${kpis.occupancyRate}%</p>
              <p style="color: #EAEAEA; font-size: 14px; margin: 4px 0;"><strong>Cancelacion:</strong> ${kpis.cancellationRate}%</p>
              <p style="color: #EAEAEA; font-size: 14px; margin: 4px 0;"><strong>Retencion:</strong> ${kpis.retentionRate}%</p>
            </div>

            <p style="color: #4A6B7A; font-size: 12px; margin: 0;">
              Para ver el detalle interactivo ingresa al panel de administracion en
              <a href="${process.env.NEXT_PUBLIC_URL}/dashboard/admin/metrics" style="color: #F78837; text-decoration: none;">Metricas</a>.
            </p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Box Turno <noreply@boxturno.com.ar>",
      to,
      subject: `[${gymName}] Reporte ${periodLabel}`,
      html,
      attachments: [
        {
          filename: `reporte_${gymName.toLowerCase().replace(/\s+/g, "_")}_${periodLabel.replace(/[^a-z0-9]/gi, "_")}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error("[EMAIL ERROR]", error);
      return false;
    }

    console.log("[REPORT EMAIL SENT]", data);
    return true;
  } catch (error) {
    console.error("[REPORT PDF/EMAIL ERROR]", error);
    return false;
  }
}
