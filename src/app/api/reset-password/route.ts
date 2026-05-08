import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Buscar token válido y no usado
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { message: "Token inválido o expirado" },
        { status: 400 }
      );
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Actualizar contraseña del usuario y marcar token como usado
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.user.id },
        data: { passwordHash: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      // Opcional: invalidar todas las sesiones del usuario para forzar re-login
      prisma.session.deleteMany({
        where: { userId: resetToken.user.id },
      }),
    ]);

    console.log(`[RESET PASSWORD] Contraseña cambiada para ${resetToken.user.email}`);

    return NextResponse.json({
      message: "Contraseña actualizada exitosamente",
    });

  } catch (error) {
    console.error("[RESET PASSWORD]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}