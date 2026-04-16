import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const payment = await prisma.payment.findFirst({
    where: { id, userId: user.id },
    select: { status: true, creditsGranted: true, pack: { select: { name: true } } },
  });

  if (!payment) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(payment);
}
