import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
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

  const transactions = await prisma.creditTransaction.findMany({
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
  });

  const hasMore  = transactions.length > limit;
  const entries  = transactions.slice(0, limit);
  const nextLimit = limit + PAGE_SIZE;

  return (
    <section className="pt-4 space-y-4">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide"
      >
        <ArrowLeftIcon size={13} />
        Perfil
      </Link>

      <div>
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl">
          Historial de abonos
        </h2>
      </div>

      {entries.length === 0 ? (
        <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-16 text-center">
          <p className="text-sm text-[#6B8A99] font-[family-name:var(--font-oswald)] uppercase tracking-wide">Aún no tenés movimientos.</p>
        </div>
      ) : (
        <>
          <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden divide-y divide-[#1A4A63]">
            {entries.map((tx) => {
              const isAdjustment = tx.type === "ADJUSTMENT";
              const isPurchase   = tx.type === "PURCHASE";

              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className={`size-9 border flex items-center justify-center shrink-0 ${
                      isAdjustment
                        ? "border-[#1A4A63] bg-[#0A1F2A]"
                        : "border-[#F78837]/30 bg-[#F78837]/10"
                    }`}
                  >
                    <span
                      className={`text-sm font-[family-name:var(--font-oswald)] font-bold leading-none ${
                        isAdjustment
                          ? tx.amount > 0
                            ? "text-[#27C7B8]"
                            : "text-[#E61919]"
                          : "text-[#F78837]"
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
                    <p className="text-sm font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight truncate">
                      {isAdjustment
                        ? "Carga Administrativa"
                        : tx.payment?.pack?.name ?? "Compra de pack"}
                    </p>
                    {isAdjustment && tx.note && (
                      <p className="text-[11px] text-[#6B8A99] truncate mt-0.5 font-[family-name:var(--font-oswald)]">
                        {tx.note}
                      </p>
                    )}
                    <p className="text-[11px] text-[#4A6B7A] tabular-nums mt-0.5 font-[family-name:var(--font-jetbrains)]">
                      {(tx.payment?.paidAt ?? tx.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                      {tx.expiresAt && (
                        <span className="ml-2 text-[#4A6B7A]">
                          · vence{" "}
                          {tx.expiresAt.toLocaleDateString("es-AR", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      )}
                    </p>
                  </div>

                  {tx.payment && (
                    <span className="text-xs font-[family-name:var(--font-jetbrains)] font-semibold text-[#EAEAEA] tabular-nums shrink-0">
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

          {hasMore && (
            <Link
              href={`/profile/history?limit=${nextLimit}`}
              className="w-full flex items-center justify-center h-10 border border-[#1A4A63] text-sm text-[#6B8A99] hover:text-[#EAEAEA] hover:border-[#6B8A99] transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide"
            >
              Ver más
            </Link>
          )}
        </>
      )}
    </section>
  );
}
