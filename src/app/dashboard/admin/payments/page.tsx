import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PaymentsListClient } from "@/components/admin/PaymentsListClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pagos de atletas" };

export default async function PaymentsPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) redirect("/");
  const gymId = user.gymId;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const limit = 25;

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where: { gymId, createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        status: true,
        provider: true,
        method: true,
        amountPaid: true,
        creditsGranted: true,
        paidAt: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        pack: { select: { name: true } },
      },
    }),
    prisma.payment.count({ where: { gymId, createdAt: { gte: start, lt: end } } }),
  ]);

  return (
    <PaymentsListClient
      initialItems={items.map((p) => ({ ...p, amountPaid: Number(p.amountPaid) }))}
      initialTotal={total}
      initialYear={year}
      initialMonth={month}
    />
  );
}
