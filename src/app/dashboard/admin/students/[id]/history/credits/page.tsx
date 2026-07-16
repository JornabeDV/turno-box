import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/ui/BackButton";
import { CreditHistoryList } from "@/components/admin/CreditHistoryList";
import type { Metadata } from "next";

const MAX_ITEMS = 100;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const student = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  return { title: `Créditos · ${student?.name ?? student?.email ?? "Alumno"}` };
}

export default async function StudentCreditsHistoryPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const student = await prisma.user.findFirst({
    where: { id, gymId: user.gymId, role: "STUDENT" },
    select: { id: true, name: true, email: true },
  });
  if (!student) notFound();

  const creditTxs = await prisma.creditTransaction.findMany({
    where: { userId: id, gymId: user.gymId },
    orderBy: { createdAt: "desc" },
    take: MAX_ITEMS,
    select: {
      id: true,
      type: true,
      amount: true,
      note: true,
      createdAt: true,
      payment: {
        select: {
          amountPaid: true,
          currency: true,
          provider: true,
          status: true,
          pack: { select: { name: true } },
        },
      },
    },
  });

  // Serializar fechas para el componente cliente
  const serializedTxs = creditTxs.map((tx) => ({
    ...tx,
    createdAt: tx.createdAt.toISOString(),
    payment: tx.payment
      ? {
          ...tx.payment,
          amountPaid: tx.payment.amountPaid?.toString() ?? null,
        }
      : null,
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <BackButton href={`/dashboard/admin/students/${id}`} />

      <div className="bg-card border border-border p-5">
        <h2 className="text-base md:text-lg lg:text-xl font-bold text-primary tracking-tight">
          Historial de créditos
        </h2>
        <p className="text-sm md:text-base text-secondary mt-1">
          {student.name ?? student.email}
        </p>
      </div>

      <div className="bg-card border border-border overflow-hidden">
        <CreditHistoryList transactions={serializedTxs} />
      </div>
    </div>
  );
}
