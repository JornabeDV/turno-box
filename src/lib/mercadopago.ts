import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig } from "mercadopago";
import crypto from "crypto";

export async function getMpAccessToken(gymId: string): Promise<string | null> {
  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    select: { mpAccessToken: true },
  });
  return gym?.mpAccessToken?.trim() || null;
}

export async function getMpWebhookSecret(gymId: string): Promise<string | null> {
  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    select: { mpWebhookSecret: true },
  });
  return gym?.mpWebhookSecret?.trim() || null;
}

export function createMpClient(accessToken: string): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken });
}

export function validateMpSignature(
  secret: string,
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  const ts = xSignature.split(",").find((p) => p.startsWith("ts="))?.slice(3) ?? "";
  const v1 = xSignature.split(",").find((p) => p.startsWith("v1="))?.slice(3) ?? "";
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return expected === v1;
}
