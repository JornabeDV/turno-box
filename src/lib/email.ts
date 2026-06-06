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

function kpiCard(label: string, value: string, color: string) {
  return `
    <td style="width: 50%; padding: 4px;">
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 12px; text-align: center;">
        <div style="font-size: 20px; font-weight: 700; color: ${color}; margin-bottom: 4px;">${value}</div>
        <div style="font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em;">${label}</div>
      </div>
    </td>
  `;
}

function topList(title: string, items: { name: string; value: string }[]) {
  const rows = items.map((i) => `
    <tr>
      <td style="padding: 10px 14px; color: #334155; font-size: 13px; border-bottom: 1px solid #F1F5F9;">${i.name}</td>
      <td style="padding: 10px 14px; color: #F78837; font-size: 13px; font-weight: 700; text-align: right; border-bottom: 1px solid #F1F5F9;">${i.value}</td>
    </tr>
  `).join("");

  return `
    <h3 style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 20px 0 10px; font-weight: 600;">${title}</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
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

    const occupancyColor = kpis.occupancyRate > 80 ? "#27C7B8" : kpis.occupancyRate > 50 ? "#F78837" : "#E61919";
    const cancellationColor = kpis.cancellationRate > 15 ? "#E61919" : "#27C7B8";
    const retentionColor = kpis.retentionRate > 70 ? "#27C7B8" : "#F78837";
    const riskColor = kpis.atRiskStudents > 10 ? "#E61919" : "#64748B";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reporte de metricas - ${gymName}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #334155; background-color: #F1F5F9; margin: 0; padding: 24px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0;">
            <tr>
              <td style="padding: 28px 28px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: middle;">
                      <h1 style="color: #0F172A; font-size: 20px; margin: 0 0 4px; font-weight: 700;">${gymName}</h1>
                      <p style="color: #64748B; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500;">Reporte ${periodLabel}</p>
                    </td>
                    <td style="width: 52px; text-align: right; vertical-align: middle;">
                      <div style="display: inline-block; width: 44px; height: 44px; background: #FFF7ED; border-radius: 50%; padding: 6px; line-height: 0;">
                        <img src="${process.env.NEXT_PUBLIC_URL}/icons/image.png?v=2" alt="Box Turno" width="32" height="32" style="display: block; border-radius: 50%;">
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr><td style="padding: 20px 28px 0;"><div style="height: 1px; background: #F1F5F9;"></div></td></tr>

            <tr>
              <td style="padding: 24px 28px 0;">
                <p style="color: #475569; font-size: 14px; margin: 0 0 20px; line-height: 1.6;">
                  Adjunto encontraras el reporte completo con las metricas del periodo. A continuacion un resumen rapido:
                </p>

                <p style="color: #94A3B8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 10px; font-weight: 600;">Resumen rapido</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    ${kpiCard("Reservas", String(kpis.totalBookings), "#0F172A")}
                    ${kpiCard("Ocupacion", `${kpis.occupancyRate}%`, occupancyColor)}
                  </tr>
                  <tr>
                    ${kpiCard("Cancelacion", `${kpis.cancellationRate}%`, cancellationColor)}
                    ${kpiCard("Retencion", `${kpis.retentionRate}%`, retentionColor)}
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 24px 28px;">
                <div style="text-align: center; margin: 4px 0 20px;">
                  <a href="${process.env.NEXT_PUBLIC_URL}/dashboard/admin/metrics" style="background-color: #F78837; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 14px;">
                    Ver metricas en el panel
                  </a>
                </div>

                <p style="color: #94A3B8; font-size: 12px; margin: 0; text-align: center;">
                  Para ver el detalle interactivo ingresa al panel de administracion.
                </p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 16px auto 0;">
            <tr>
              <td style="text-align: center; padding: 12px;">
                <p style="color: #94A3B8; font-size: 11px; margin: 0;">
                  Generado automaticamente por Box Turno
                </p>
              </td>
            </tr>
          </table>
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
