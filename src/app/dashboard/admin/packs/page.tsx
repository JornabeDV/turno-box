import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddPackButton } from "@/components/admin/AddPackButton";
import { PacksListClient } from "./PacksListClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Abonos" };

export default async function AdminPacksPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const [packs, totalRevenue] = await Promise.all([
    prisma.pack.findMany({
      where: { gymId: user.gymId },
      orderBy: [{ sortOrder: "asc" }, { credits: "asc" }],
      include: {
        _count: { select: { payments: { where: { status: "APPROVED" } } } },
      },
    }),
    prisma.payment.aggregate({
      where: { gymId: user.gymId, status: "APPROVED" },
      _sum: { amountPaid: true },
    }),
  ]);

  const revenue = Number(totalRevenue._sum.amountPaid ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Admin</p>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Abonos</h2>
        </div>
        <AddPackButton />
      </div>

      {/* Métrica de ingresos */}
      {revenue > 0 && (
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">
              {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(revenue)}
            </p>
            <p className="text-xs text-zinc-500">Ingresos totales</p>
          </div>
        </div>
      )}

      {/* Lista de abonos */}
      {packs.length === 0 ? (
        <div className="glass-card rounded-2xl px-4 py-16 text-center">
          <p className="text-sm text-zinc-500 mb-4">No hay abonos creados todavía.</p>
          <AddPackButton />
        </div>
      ) : (
        <PacksListClient
          packs={packs.map((p) => ({ ...p, price: Number(p.price) }))}
        />
      )}
    </div>
  );
}
