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

  // Pedimos limit+1 para saber si hay más sin traer todo
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
    <section className="pt-5 space-y-4">
      {/* Header */}
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeftIcon size={13} />
        Perfil
      </Link>

      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Cuenta</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Historial de abonos</h2>
      </div>

      {entries.length === 0 ? (
        <div className="glass-card rounded-2xl px-4 py-16 text-center">
          <p className="text-sm text-zinc-600">Aún no tenés movimientos.</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            {entries.map((entry) => {
              if (entry.kind === "payment") {
                const p = entry.payment;
                return (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="size-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-orange-400 leading-none">
                        {p.creditsGranted}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">{p.pack?.name ?? "Abono eliminado"}</p>
                      <p className="text-[11px] text-zinc-600 tabular-nums">
                        {p.paidAt?.toLocaleDateString("es-AR", {
                          day: "numeric", month: "short", year: "numeric",
                        }) ?? "—"}
                        {p.expiresAt && (
                          <span className="ml-2 text-zinc-700">
                            · vence{" "}
                            {p.expiresAt.toLocaleDateString("es-AR", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-zinc-300 tabular-nums shrink-0">
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
                  <div className="size-9 rounded-xl bg-zinc-800 border border-white/[0.06] flex items-center justify-center shrink-0">
                    <span
                      className={`text-sm font-black leading-none ${
                        a.amount > 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {a.amount > 0 ? `+${a.amount}` : a.amount}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100">Carga Administrativa</p>
                    {a.note && (
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">{a.note}</p>
                    )}
                    <p className="text-[11px] text-zinc-600 tabular-nums mt-0.5">
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
              className="w-full flex items-center justify-center h-10 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              Ver más
            </Link>
          )}
        </>
      )}
    </section>
  );
}
