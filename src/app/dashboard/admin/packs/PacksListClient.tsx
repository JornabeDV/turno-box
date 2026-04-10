"use client";

import { useState } from "react";
import { PackToggleButton } from "@/components/admin/PackToggleButton";
import { EditPackModal, type PackData } from "@/components/admin/EditPackModal";
import { cn } from "@/lib/utils";

type PackRow = PackData & {
  currency: string;
  isActive: boolean;
  _count: { payments: number };
};

interface Props {
  packs: PackRow[];
}

export function PacksListClient({ packs }: Props) {
  const [editing, setEditing] = useState<PackData | null>(null);

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
        {packs.map((pack) => (
          <div
            key={pack.id}
            onClick={() => setEditing(pack)}
            className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors group"
          >
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

            {/* Toggle — stopPropagation para que no abra el modal al togglear */}
            <div onClick={(e) => e.stopPropagation()}>
              <PackToggleButton packId={pack.id} initialIsActive={pack.isActive} />
            </div>
          </div>
        ))}
      </div>

      <EditPackModal pack={editing} onClose={() => setEditing(null)} />
    </>
  );
}
