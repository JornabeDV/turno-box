import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/ui/BackButton";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import { GYM_TIMEZONE } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Historial de abonos" };

const PAGE_SIZE = 5;

type Props = { searchParams: Promise<{ limit?: string }> };

export default async function CreditsHistoryPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userId = session.user.id;
  const gymId  = (session.user as { gymId?: string }).gymId ?? "";

  const { limit: limitParam } = await searchParams;
  const limit = Math.max(PAGE_SIZE, Math.min(200, Number(limitParam) || PAGE_SIZE));

  const [gym, transactions] = await Promise.all([
    prisma.gym.findUnique({
      where: { id: gymId },
      select: { timezone: true },
    }),
    prisma.creditTransaction.findMany({
      where: {
        userId,
        gymId,
        type: { in: ["PURCHASE", "ADJUSTMENT"] },
      },
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
      },
    }),
  ]);

  const timezone = gym?.timezone ?? GYM_TIMEZONE;

  const hasMore  = transactions.length > limit;
  const entries  = transactions.slice(0, limit);
  const nextLimit = limit + PAGE_SIZE;

  return (
    <section className="pt-4 md:pt-8 space-y-4 md:space-y-6">
      <BackButton href="/profile" />

      <div>
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl md:text-4xl">
          Historial de abonos
        </h2>
        <p className="text-sm md:text-lg text-secondary mt-1 md:mt-2 font-[family-name:var(--font-oswald)]">
          Movimientos de compras y ajustes
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="bg-card border border-border px-4 py-16 md:px-6 md:py-20 text-center">
          <p className="text-sm md:text-base text-secondary font-[family-name:var(--font-oswald)] uppercase tracking-wide">Aún no tenés movimientos.</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border overflow-hidden divide-y divide-border">
            {entries.map((tx) => {
              const isAdjustment = tx.type === "ADJUSTMENT";
              const isPurchase   = tx.type === "PURCHASE";

              return (
                <div key={tx.id} className="flex items-center gap-3 md:gap-4 px-4 py-3.5 md:px-6 md:py-5">
                  <div
                    className={`size-9 md:size-12 border flex items-center justify-center shrink-0 ${
                      isAdjustment
                        ? "border-border bg-page"
                        : "border-brand/30 bg-brand/10"
                    }`}
                  >
                    <span
                      className={`text-sm md:text-base font-[family-name:var(--font-oswald)] font-bold leading-none ${
                        isAdjustment
                          ? tx.amount > 0
                            ? "text-success"
                            : "text-danger"
                          : "text-brand"
                      }`}
                    >
                      {isAdjustment
                        ? tx.amount > 0
                          ? `+${tx.amount}`
                          : tx.amount
                        : tx.amount}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-lg font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight truncate">
                      {isAdjustment
                        ? "Carga Administrativa"
                        : tx.payment?.pack?.name ?? "Compra de pack"}
                    </p>
                    {isAdjustment && tx.note && (
                      <p className="text-[11px] md:text-sm text-secondary truncate mt-0.5 md:mt-1 font-[family-name:var(--font-oswald)]">
                        {tx.note}
                      </p>
                    )}
                    <p className="text-[11px] md:text-sm text-muted tabular-nums mt-0.5 md:mt-1 font-[family-name:var(--font-jetbrains)]">
                      {(tx.payment?.paidAt ?? tx.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric", month: "short", year: "numeric",
                        timeZone: timezone,
                      })}
                      {tx.expiresAt && (
                        <span className="ml-2 text-muted">
                          · vence{" "}
                          {tx.expiresAt.toLocaleDateString("es-AR", {
                            day: "numeric", month: "short", year: "numeric",
                            timeZone: timezone,
                          })}
                        </span>
                      )}
                    </p>
                  </div>

                  {tx.payment && (
                    <span className="text-xs md:text-sm font-[family-name:var(--font-jetbrains)] font-semibold text-primary tabular-nums shrink-0">
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: tx.payment.currency,
                        maximumFractionDigits: 0,
                      }).format(Number(tx.payment.amountPaid))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {hasMore && <LoadMoreButton nextLimit={nextLimit} basePath="/profile/history" />}
        </>
      )}
    </section>
  );
}
