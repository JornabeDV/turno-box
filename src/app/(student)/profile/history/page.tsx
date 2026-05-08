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

  const [payments, adjustments] = await Promise.all([
    prisma.payment.findMany({
      where: { userId, status: "APPROVED" },
      orderBy: { paidAt: "desc" },
      take: limit + 1,
      select: {
        id: true,
        amountPaid: true,
        currency: true,
        paidAt: true,
        expiresAt: true,
        creditsGranted: true,
        pack: { select: { name: true } },
      },
    }),
    prisma.creditTransaction.findMany({
      where: { userId, gymId, type: "ADJUSTMENT" },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      select: { id: true, amount: true, note: true, createdAt: true },
    }),
  ]);

  type Entry =
    | { kind: "payment"; date: Date; id: string; payment: (typeof payments)[0] }
    | { kind: "adjustment"; date: Date; id: string; adj: (typeof adjustments)[0] };

  const all: Entry[] = [
    ...payments.map((p) => ({
      kind: "payment" as const,
      date: p.paidAt ?? new Date(0),
      id: p.id,
      payment: p,
    })),
    ...adjustments.map((a) => ({
      kind: "adjustment" as const,
      date: a.createdAt,
      id: a.id,
      adj: a,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const hasMore  = all.length > limit;
  const entries  = all.slice(0, limit);
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
            {entries.map((entry) => {
              if (entry.kind === "payment") {
                const p = entry.payment;
                return (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="size-9 border border-[#F78837]/30 bg-[#F78837]/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-[family-name:var(--font-oswald)] font-bold text-[#F78837] leading-none">
                        {p.creditsGranted}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight truncate">{p.pack?.name ?? "Abono eliminado"}</p>
                      <p className="text-[11px] text-[#4A6B7A] tabular-nums font-[family-name:var(--font-jetbrains)]">
                        {p.paidAt?.toLocaleDateString("es-AR", {
                          day: "numeric", month: "short", year: "numeric",
                        }) ?? "—"}
                        {p.expiresAt && (
                          <span className="ml-2 text-[#4A6B7A]">
                            · vence{" "}
                            {p.expiresAt.toLocaleDateString("es-AR", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-[family-name:var(--font-jetbrains)] font-semibold text-[#EAEAEA] tabular-nums shrink-0">
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: p.currency,
                        maximumFractionDigits: 0,
                      }).format(Number(p.amountPaid))}
                    </span>
                  </div>
                );
              }

              const a = entry.adj;
              return (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="size-9 border border-[#1A4A63] bg-[#0A1F2A] flex items-center justify-center shrink-0">
                    <span
                      className={`text-sm font-[family-name:var(--font-oswald)] font-bold leading-none ${
                        a.amount > 0 ? "text-[#27C7B8]" : "text-[#E61919]"
                      }`}
                    >
                      {a.amount > 0 ? `+${a.amount}` : a.amount}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight truncate">Carga Administrativa</p>
                    {a.note && (
                      <p className="text-[11px] text-[#6B8A99] truncate mt-0.5 font-[family-name:var(--font-oswald)]">{a.note}</p>
                    )}
                    <p className="text-[11px] text-[#4A6B7A] tabular-nums mt-0.5 font-[family-name:var(--font-jetbrains)]">
                      {a.createdAt.toLocaleDateString("es-AR", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
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
