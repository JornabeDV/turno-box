import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PackToggleButton } from "@/components/admin/PackToggleButton";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Packs de clases" };

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
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Packs de clases</h2>
        </div>
        <Link href="/dashboard/admin/packs/new">
          <Button size="sm" variant="brand">
            <PlusIcon size={14} weight="bold" />
            Nuevo pack
          </Button>
        </Link>
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

      {/* Lista de packs */}
      {packs.length === 0 ? (
        <div className="glass-card rounded-2xl px-4 py-16 text-center">
          <p className="text-sm text-zinc-500 mb-4">No hay packs creados todavía.</p>
          <Link href="/dashboard/admin/packs/new">
            <Button variant="brand" size="md">Crear primer pack</Button>
          </Link>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
          {packs.map((pack) => (
            <div key={pack.id} className="flex items-center gap-3 px-4 py-3.5">
              {/* Credits circle */}
              <div className={cn(
                "size-10 rounded-xl border flex flex-col items-center justify-center shrink-0",
                pack.isActive
                  ? "bg-orange-500/10 border-orange-500/20"
                  : "bg-zinc-900 border-white/[0.04]"
              )}>
                <span className={cn("text-base font-black leading-none", pack.isActive ? "text-orange-400" : "text-zinc-600")}>
                  {pack.credits}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", pack.isActive ? "text-zinc-100" : "text-zinc-500")}>
                  {pack.name}
                </p>
                <p className="text-xs text-zinc-600 font-mono tabular-nums">
                  {new Intl.NumberFormat("es-AR", { style: "currency", currency: pack.currency, maximumFractionDigits: 0 }).format(Number(pack.price))}
                  {pack.validityDays ? ` · ${pack.validityDays}d` : " · sin vencimiento"}
                </p>
              </div>

              {/* Ventas */}
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-xs font-mono font-bold text-zinc-300 tabular-nums">
                  {pack._count.payments}
                </p>
                <p className="text-[10px] text-zinc-600">ventas</p>
              </div>

              <PackToggleButton packId={pack.id} initialIsActive={pack.isActive} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
