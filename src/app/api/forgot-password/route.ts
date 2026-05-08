import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Email inválido" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      // No revelamos si el usuario existe o no por seguridad
      return NextResponse.json({
        message: "Si existe una cuenta con ese email, recibirás instrucciones para resetear tu contraseña.",
      });
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en BD
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Enviar email con el enlace de reset
    const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password/${token}`;
    const emailSent = await sendPasswordResetEmail(email, resetUrl, user.name || undefined);

    if (!emailSent) {
      console.error(`[FORGOT PASSWORD] Error enviando email a ${email}`);
      // No devolvemos error al usuario por seguridad (no revelar si el email existe)
    } else {
      console.log(`[FORGOT PASSWORD] Email enviado a ${email}`);
    }

    return NextResponse.json({
      message: "Si existe una cuenta con ese email, recibirás instrucciones para resetear tu contraseña.",
    });

  } catch (error) {
    console.error("[FORGOT PASSWORD]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}