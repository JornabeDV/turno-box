import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PackCard } from "@/components/billing/PackCard";
import { CreditsBadge } from "@/components/billing/CreditsBadge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Comprar clases" };

export default async function PacksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  const session = await auth();
  const user = session?.user as { id?: string; gymId?: string } | undefined;
  if (!user?.id || !user.gymId) redirect("/auth/login");

  const { error, info } = await searchParams;

  const [packs, balance] = await Promise.all([
    prisma.pack.findMany({
      where: { gymId: user.gymId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { credits: "asc" }],
    }),
    prisma.userCreditBalance.findUnique({
      where: { userId_gymId: { userId: user.id, gymId: user.gymId } },
      select: { availableCredits: true },
    }),
  ]);

  const credits = balance?.availableCredits ?? 0;

  return (
    <section className="px-4 pt-5 pb-24">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Turnos</p>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Comprar clases</h2>
        </div>
        <CreditsBadge credits={credits} />
      </div>

      {error === "rejected" && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
          El pago fue rechazado. Podés intentar con otro método de pago.
        </div>
      )}
      {info === "pending" && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400">
          Tu pago está siendo procesado. Los créditos se acreditarán automáticamente.
        </div>
      )}

      {packs.length === 0 ? (
        <div className="glass-card rounded-2xl px-4 py-16 text-center">
          <p className="text-sm text-zinc-500">No hay abonos disponibles en este momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-700 text-center mt-6">
        Los pagos son procesados de forma segura por MercadoPago.
      </p>
    </section>
  );
}
