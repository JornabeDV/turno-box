import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

const PAGE_SIZE = 5;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const student = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  return { title: `Créditos · ${student?.name ?? student?.email ?? "Alumno"}` };
}

export default async function StudentCreditsHistoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;

  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const student = await prisma.user.findFirst({
    where: { id, gymId: user.gymId, role: "STUDENT" },
    select: { id: true, name: true, email: true },
  });
  if (!student) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [creditTxs, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId: id, gymId: user.gymId },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
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
    }),
    prisma.creditTransaction.count({ where: { userId: id, gymId: user.gymId } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href={`/dashboard/admin/students/${id}`}
        className="inline-flex items-center gap-1.5 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
      >
        <ArrowLeftIcon size={13} />
        Volver al alumno
      </Link>

      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5">
        <h2 className="text-lg font-bold text-[#EAEAEA] tracking-tight">
          Historial de créditos
        </h2>
        <p className="text-sm text-[#6B8A99] mt-1">
          {student.name ?? student.email}
        </p>
      </div>

      <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
        {creditTxs.length === 0 ? (
          <p className="text-xs text-[#4A6B7A] text-center py-12">
            Sin movimientos de créditos.
          </p>
        ) : (
          <div className="divide-y divide-[#1A4A63]">
            {creditTxs.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={cn(
                    "size-8 border flex items-center justify-center shrink-0",
                    tx.amount > 0
                      ? "border-[#27C7B8]/30 bg-[#27C7B8]/10"
                      : "border-[#E61919]/30 bg-[#E61919]/10",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-bold leading-none",
                      tx.amount > 0 ? "text-[#27C7B8]" : "text-[#E61919]",
                    )}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#EAEAEA] truncate">
                    {tx.type === "ADJUSTMENT" && "Ajuste manual"}
                    {tx.type === "PURCHASE" && (tx.payment?.pack?.name ?? "Compra de pack")}
                    {tx.type === "CONSUME" && "Reserva de turno"}
                    {tx.type === "REFUND" && "Reembolso"}
                    {tx.type === "EXPIRY" && "Vencimiento"}
                  </p>
                  {tx.note && (
                    <p className="text-xs text-[#6B8A99] truncate">{tx.note}</p>
                  )}
                  <p className="text-[10px] text-[#4A6B7A]">
                    {tx.createdAt.toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {tx.payment && (
                      <span className="ml-2">
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: tx.payment.currency,
                          maximumFractionDigits: 0,
                        }).format(Number(tx.payment.amountPaid))}
                        {tx.payment.provider === "MANUAL" && (
                          <span className="text-[#6B8A99] ml-1">(manual)</span>
                        )}
                        {tx.payment.provider === "MERCADOPAGO" && (
                          <span className="text-[#6B8A99] ml-1">(MP)</span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/admin/students/${id}/history/credits?page=${page - 1}`}
            className={cn(
              "inline-flex items-center gap-1 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors",
              !hasPrev && "pointer-events-none opacity-30",
            )}
          >
            <CaretLeftIcon size={12} />
            Anterior
          </Link>
          <span className="text-xs text-[#6B8A99] tabular-nums">
            Página {page} de {totalPages}
          </span>
          <Link
            href={`/dashboard/admin/students/${id}/history/credits?page=${page + 1}`}
            className={cn(
              "inline-flex items-center gap-1 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors",
              !hasNext && "pointer-events-none opacity-30",
            )}
          >
            Siguiente
            <CaretRightIcon size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
