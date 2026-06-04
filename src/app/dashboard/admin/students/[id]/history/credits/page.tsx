import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/ui/BackButton";
import Link from "next/link";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
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
      <BackButton href={`/dashboard/admin/students/${id}`} />

      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5">
        <h2 className="text-base md:text-lg lg:text-xl font-bold text-[#EAEAEA] tracking-tight">
          Historial de créditos
        </h2>
        <p className="text-sm md:text-base text-[#6B8A99] mt-1">
          {student.name ?? student.email}
        </p>
      </div>

      <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
        {creditTxs.length === 0 ? (
          <p className="text-xs md:text-sm text-[#4A6B7A] text-center py-12 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
            Sin movimientos de créditos.
          </p>
        ) : (
          <div className="divide-y divide-[#1A4A63]">
            {creditTxs.map((tx) => {
              const typeLabel =
                tx.type === "ADJUSTMENT"
                  ? "Ajuste manual"
                  : tx.type === "PURCHASE"
                    ? (tx.payment?.pack?.name ?? "Compra de pack")
                    : tx.type === "CONSUME"
                      ? "Reserva de turno"
                      : tx.type === "REFUND"
                        ? "Reembolso"
                        : tx.type === "EXPIRY"
                          ? "Vencimiento"
                          : tx.type;

              const typeColor =
                tx.type === "CONSUME" || tx.type === "EXPIRY"
                  ? "text-[#E61919]"
                  : tx.type === "PURCHASE"
                    ? "text-[#F78837]"
                    : tx.type === "ADJUSTMENT"
                      ? "text-[#EAEAEA]"
                      : tx.type === "REFUND"
                        ? "text-[#27C7B8]"
                        : "text-[#EAEAEA]";

              return (
                <div
                  key={tx.id}
                  className="group flex flex-col md:grid md:grid-cols-[4rem_1fr_10rem_10rem] gap-3 md:gap-5 px-4 md:px-6 py-4 md:py-5 hover:bg-[#0A1F2A]/60 transition-colors"
                >
                  {/* Icono + cantidad */}
                  <div className="flex md:flex-col md:items-center gap-3 md:gap-1.5">
                    <div
                      className={cn(
                        "size-9 md:size-10 border flex items-center justify-center shrink-0",
                        tx.amount > 0
                          ? "border-[#27C7B8]/30 bg-[#27C7B8]/10"
                          : "border-[#E61919]/30 bg-[#E61919]/10",
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm md:text-base font-bold leading-none font-[family-name:var(--font-oswald)]",
                          tx.amount > 0 ? "text-[#27C7B8]" : "text-[#E61919]",
                        )}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </span>
                    </div>
                    {/* Badge tipo en mobile */}
                    <span className="md:hidden text-xs font-[family-name:var(--font-oswald)] uppercase tracking-wide text-[#6B8A99]">
                      {typeLabel}
                    </span>
                  </div>

                  {/* Concepto + nota */}
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="hidden md:block text-sm lg:text-base font-[family-name:var(--font-oswald)] font-bold uppercase tracking-tight truncate">
                      <span className={typeColor}>{typeLabel}</span>
                    </p>
                    {tx.note && (
                      <p className="text-base md:text-sm text-[#6B8A99] truncate font-[family-name:var(--font-oswald)]">
                        {tx.note}
                      </p>
                    )}
                    {/* Info de pago en mobile */}
                    {tx.payment && (
                      <div className="md:hidden flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm font-semibold text-[#EAEAEA] font-[family-name:var(--font-jetbrains)] tabular-nums">
                          {new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: tx.payment.currency,
                            maximumFractionDigits: 0,
                          }).format(Number(tx.payment.amountPaid))}
                        </span>
                        {tx.payment.provider === "MANUAL" && (
                          <span className="text-[11px] px-1.5 py-0.5 border border-[#1A4A63] text-[#6B8A99] font-[family-name:var(--font-jetbrains)]">
                            MANUAL
                          </span>
                        )}
                        {tx.payment.provider === "MERCADOPAGO" && (
                          <span className="text-[11px] px-1.5 py-0.5 border border-[#1A4A63] text-[#6B8A99] font-[family-name:var(--font-jetbrains)]">
                            MP
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="hidden md:flex flex-col justify-center">
                    <p className="text-sm lg:text-base text-[#6B8A99] font-[family-name:var(--font-jetbrains)] tabular-nums">
                      {tx.createdAt.toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs lg:text-sm text-[#4A6B7A] font-[family-name:var(--font-jetbrains)] tabular-nums mt-0.5">
                      {tx.createdAt.toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Monto + proveedor */}
                  <div className="hidden md:flex flex-col items-end justify-center text-right">
                    {tx.payment ? (
                      <>
                        <span className="text-sm lg:text-base font-semibold text-[#EAEAEA] font-[family-name:var(--font-jetbrains)] tabular-nums">
                          {new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: tx.payment.currency,
                            maximumFractionDigits: 0,
                          }).format(Number(tx.payment.amountPaid))}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          {tx.payment.provider === "MANUAL" && (
                            <span className="text-[11px] px-2 py-0.5 border border-[#1A4A63] text-[#6B8A99] font-[family-name:var(--font-jetbrains)] uppercase tracking-wide">
                              Manual
                            </span>
                          )}
                          {tx.payment.provider === "MERCADOPAGO" && (
                            <span className="text-[11px] px-2 py-0.5 border border-[#1A4A63] text-[#6B8A99] font-[family-name:var(--font-jetbrains)] uppercase tracking-wide">
                              MercadoPago
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-[#4A6B7A] font-[family-name:var(--font-jetbrains)]">
                        —
                      </span>
                    )}
                  </div>

                  {/* Fecha en mobile (cuando no hay pago) */}
                  <div className="md:hidden text-xs text-[#4A6B7A] font-[family-name:var(--font-jetbrains)] tabular-nums">
                    {tx.createdAt.toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/admin/students/${id}/history/credits?page=${page - 1}`}
            className={cn(
              "inline-flex items-center gap-1 text-xs md:text-sm text-[#6B8A99] hover:text-[#EAEAEA] transition-colors",
              !hasPrev && "pointer-events-none opacity-30",
            )}
          >
            <CaretLeftIcon size={12} />
            Anterior
          </Link>
          <span className="text-xs md:text-sm text-[#6B8A99] tabular-nums">
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
