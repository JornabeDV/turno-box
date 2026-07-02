// Estado de cuenta de créditos del estudiante
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/ui/BackButton";
import Link from "next/link";
import {
  Clock,
  WarningCircle,
  Minus,
  Plus,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mis créditos" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 5;

type Props = { searchParams: Promise<{ limit?: string }> };

export default async function CreditsPage({ searchParams }: Props) {
  const { limit: limitParam } = await searchParams;
  const limit = Math.max(
    PAGE_SIZE,
    Math.min(200, Number(limitParam) || PAGE_SIZE),
  );

  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userId = session.user.id;
  const gymId = (session.user as { gymId?: string }).gymId ?? "";

  if (!gymId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center border border-[#1A4A63] bg-[#0E2A38]">
        <span className="text-3xl text-[#F78837] mb-4">✕</span>
        <h2 className="text-lg font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight mb-2">
          Sin gym asignado
        </h2>
        <p className="text-sm text-[#6B8A99] max-w-xs font-[family-name:var(--font-oswald)]">
          Tu cuenta está activa, pero aún no fuiste asignado a ningún gimnasio.
        </p>
      </div>
    );
  }

  const now = new Date();

  const [balance, activePayments, transactions] = await Promise.all([
    prisma.userCreditBalance.findUnique({
      where: { userId_gymId: { userId, gymId } },
      select: { availableCredits: true },
    }),
    prisma.payment.findMany({
      where: {
        userId,
        gymId,
        status: "APPROVED",
        OR: [{ expiresAt: { gt: now } }, { expiresAt: null }],
      },
      select: {
        id: true,
        creditsGranted: true,
        amountPaid: true,
        currency: true,
        paidAt: true,
        expiresAt: true,
        pack: { select: { name: true } },
        creditTxs: { select: { amount: true } },
      },
      orderBy: { expiresAt: "asc" },
    }),
    prisma.creditTransaction.findMany({
      where: { userId, gymId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      select: {
        id: true,
        type: true,
        amount: true,
        note: true,
        createdAt: true,
        expiresAt: true,
        payment: {
          select: {
            amountPaid: true,
            currency: true,
            paidAt: true,
            pack: { select: { name: true } },
          },
        },
        booking: {
          select: {
            classDate: true,
            class: {
              select: {
                description: true,
                startTime: true,
                discipline: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const hasMore = transactions.length > limit;
  const visibleTransactions = transactions.slice(0, limit);
  const nextLimit = limit + PAGE_SIZE;

  const totalCredits = balance?.availableCredits ?? 0;

  // Calcular datos por abono
  const activeSubs = activePayments
    .map((p) => {
      const used = Math.abs(
        p.creditTxs.reduce((s, t) => s + (t.amount < 0 ? t.amount : 0), 0),
      );
      const remaining = p.creditTxs.reduce((s, t) => s + t.amount, 0);
      const daysToExpiry = p.expiresAt
        ? Math.ceil((p.expiresAt.getTime() - now.getTime()) / 86_400_000)
        : null;
      return {
        ...p,
        used,
        remaining,
        daysToExpiry,
        isExpiringSoon:
          daysToExpiry !== null && daysToExpiry <= 7 && daysToExpiry > 0,
        isExpired: daysToExpiry !== null && daysToExpiry <= 0,
      };
    })
    .filter((p) => p.remaining > 0);

  const nextExpiry =
    activeSubs.find((s) => s.daysToExpiry !== null)?.daysToExpiry ?? null;

  return (
    <section className="pt-4 md:pt-8 space-y-5 md:space-y-8">
      <BackButton href="/" />
      {/* Título */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl md:text-4xl">
            Mis créditos
          </h1>
          <p className="text-sm md:text-lg text-[#6B8A99] mt-1 md:mt-2 font-[family-name:var(--font-oswald)]">
            Estado de tus clases y abonos activos
          </p>
        </div>
        <Link
          href="/packs"
          className="inline-flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-3 bg-[#F78837] text-[#0A1F2A] text-xs md:text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide active:scale-[0.98] transition-transform"
        >
          Comprar
        </Link>
      </div>

      {/* Resumen */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 md:p-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="size-14 md:size-20 border border-[#F78837]/30 bg-[#F78837]/10 flex items-center justify-center shrink-0">
            <Wallet size={24} weight="bold" className="text-[#F78837] md:size-8" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#6B8A99]">
              Disponibles
            </p>
            <p className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] text-3xl md:text-4xl leading-none mt-0.5 md:mt-1">
              {totalCredits}{" "}
              <span className="text-lg md:text-2xl text-[#6B8A99]">
                {totalCredits === 1 ? "clase" : "clases"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-10 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-[#1A4A63]">
          <div>
            <p className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#4A6B7A]">
              Abonos activos
            </p>
            <p className="text-sm md:text-lg font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] mt-0.5 md:mt-1">
              {activeSubs.length}
            </p>
          </div>
          {nextExpiry !== null && (
            <div>
              <p className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#4A6B7A]">
                Próximo vencimiento
              </p>
              <p
                className={cn(
                  "text-sm md:text-lg font-[family-name:var(--font-oswald)] font-bold mt-0.5 md:mt-1",
                  nextExpiry <= 7 ? "text-[#F78837]" : "text-[#EAEAEA]",
                )}
              >
                {nextExpiry <= 0 ? "Vencido" : `${nextExpiry} ${nextExpiry === 1 ? "día" : "días"}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Abonos activos */}
      {activeSubs.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-lg md:text-2xl">
            Abonos activos
          </h2>

          <div className="space-y-3 md:space-y-4">
            {activeSubs.map((sub) => {
              const progress =
                sub.creditsGranted > 0
                  ? Math.round((sub.used / sub.creditsGranted) * 100)
                  : 0;

              return (
                <div
                  key={sub.id}
                  className="bg-[#0E2A38] border border-[#1A4A63] p-4 md:p-6"
                >
                  <div className="flex items-start justify-between gap-3 md:gap-4">
                    <div>
                      <p className="text-sm md:text-lg font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight">
                        {sub.pack?.name ?? "Abono"}
                      </p>
                      <p className="text-[11px] md:text-sm text-[#4A6B7A] mt-0.5 md:mt-1 font-[family-name:var(--font-jetbrains)]">
                        Comprado{" "}
                        {sub.paidAt?.toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                        }) ?? "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm md:text-xl font-[family-name:var(--font-oswald)] font-bold text-[#27C7B8]">
                        {sub.remaining}
                        <span className="text-[#6B8A99] text-xs md:text-sm">
                          /{sub.creditsGranted}
                        </span>
                      </p>
                      <p className="text-[10px] md:text-xs text-[#4A6B7A] font-[family-name:var(--font-jetbrains)]">
                        restantes
                      </p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mt-3 md:mt-4 h-1 md:h-1.5 bg-[#1A4A63] overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        sub.isExpiringSoon ? "bg-[#F78837]" : "bg-[#27C7B8]",
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 md:mt-3">
                    <p className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] text-[#4A6B7A] uppercase tracking-wider">
                      {sub.used} usadas
                    </p>
                    {sub.expiresAt && (
                      <p
                        className={cn(
                          "text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider",
                          sub.isExpiringSoon
                            ? "text-[#F78837]"
                            : "text-[#4A6B7A]",
                        )}
                      >
                        Vence{" "}
                        {sub.expiresAt.toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial de movimientos */}
      <div className="space-y-3 md:space-y-4">
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-lg md:text-2xl">
          Historial de movimientos
        </h2>

        {visibleTransactions.length === 0 ? (
          <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-12 md:py-16 text-center">
            <Clock size={24} className="text-[#1A4A63] mx-auto mb-2 md:mb-3 md:size-8" />
            <p className="text-sm md:text-base text-[#6B8A99] font-[family-name:var(--font-oswald)] uppercase tracking-wide">
              Aún no tenés movimientos.
            </p>
          </div>
        ) : (
          <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden divide-y divide-[#1A4A63]">
            {visibleTransactions.map((tx) => {
              const isPositive = tx.amount > 0;
              const isConsume = tx.type === "CONSUME";
              const isRefund = tx.type === "REFUND";
              const isPurchase = tx.type === "PURCHASE";
              const isAdjustment = tx.type === "ADJUSTMENT";
              const isExpiry = tx.type === "EXPIRY";

              return (
                <div key={tx.id} className="flex items-start gap-3 md:gap-4 px-4 py-3.5 md:px-6 md:py-5">
                  {/* Icono / indicador */}
                  <div
                    className={cn(
                      "size-9 md:size-12 border flex items-center justify-center shrink-0 mt-0.5",
                      isPositive
                        ? "border-[#27C7B8]/30 bg-[#27C7B8]/10"
                        : "border-[#E61919]/30 bg-[#E61919]/10",
                    )}
                  >
                    {isPositive ? (
                      <Plus
                        size={14}
                        weight="bold"
                        className="text-[#27C7B8] md:size-5"
                      />
                    ) : (
                      <Minus
                        size={14}
                        weight="bold"
                        className="text-[#E61919] md:size-5"
                      />
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 md:gap-3">
                      <p className="text-sm md:text-lg font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight">
                        {isPurchase &&
                          (tx.payment?.pack?.name ?? "Compra de abono")}
                        {isConsume &&
                          (tx.booking?.class?.discipline?.name ??
                            tx.booking?.class?.description ??
                            "Reserva de turno")}
                        {isRefund && "Reembolso"}
                        {isExpiry && "Vencimiento"}
                        {isAdjustment && "Ajuste manual"}
                      </p>
                      <span
                        className={cn(
                          "text-xs md:text-sm font-[family-name:var(--font-oswald)] font-bold tabular-nums shrink-0",
                          isPositive ? "text-[#27C7B8]" : "text-[#E61919]",
                        )}
                      >
                        {isPositive ? `+${tx.amount}` : tx.amount}
                      </span>
                    </div>

                    {/* Detalle secundario */}
                    {isConsume && tx.booking && (
                      <p className="text-[11px] md:text-sm text-[#6B8A99] truncate mt-0.5 md:mt-1 font-[family-name:var(--font-oswald)]">
                        {tx.booking.classDate.toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                        })}
                        {tx.booking.class?.startTime &&
                          ` · ${tx.booking.class.startTime} hrs`}
                      </p>
                    )}
                    {isPurchase && tx.payment && (
                      <p className="text-[11px] md:text-sm text-[#6B8A99] truncate mt-0.5 md:mt-1 font-[family-name:var(--font-oswald)]">
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: tx.payment.currency,
                          maximumFractionDigits: 0,
                        }).format(Number(tx.payment.amountPaid))}
                      </p>
                    )}
                    {isAdjustment && tx.note && (
                      <p className="text-[11px] md:text-sm text-[#6B8A99] truncate mt-0.5 md:mt-1 font-[family-name:var(--font-oswald)]">
                        {tx.note}
                      </p>
                    )}

                    {/* Fecha */}
                    <p className="text-[10px] md:text-xs text-[#4A6B7A] mt-1 md:mt-1.5 font-[family-name:var(--font-jetbrains)] tabular-nums">
                      {tx.createdAt.toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && <LoadMoreButton nextLimit={nextLimit} basePath="/credits" />}
      </div>
    </section>
  );
}
