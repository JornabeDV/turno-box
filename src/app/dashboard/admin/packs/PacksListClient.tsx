"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { PackToggleButton } from "@/components/admin/PackToggleButton";
import { EditPackModal, type PackData } from "@/components/admin/EditPackModal";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { deletePackAction } from "@/actions/payments";
import { cn } from "@/lib/utils";

type PackRow = PackData & {
  currency: string;
  isActive: boolean;
  _count: { payments: number };
};

interface Props {
  packs: PackRow[];
}

export function PacksListClient({ packs: initial }: Props) {
  const [packs, setPacks] = useState(initial);
  const [editing, setEditing] = useState<PackData | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirmDeleteId) return;
    startTransition(async () => {
      const res = await deletePackAction(confirmDeleteId);
      if (res.success) {
        setPacks((prev) => prev.filter((p) => p.id !== confirmDeleteId));
        setConfirmDeleteId(null);
        toast.success("Abono eliminado");
      } else {
        toast.error(res.error);
      }
    });
  }

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

            {/* Toggle */}
            <div onClick={(e) => e.stopPropagation()}>
              <PackToggleButton packId={pack.id} initialIsActive={pack.isActive} />
            </div>

            {/* Eliminar */}
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(pack.id); }}
              className="size-8 rounded-lg flex items-center justify-center text-zinc-500 cursor-pointer hover:text-rose-400 hover:bg-zinc-800 transition-all shrink-0"
            >
              <TrashIcon size={16} weight="bold" />
            </button>
          </div>
        ))}
      </div>

      <EditPackModal pack={editing} onClose={() => setEditing(null)} />

      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
        title="Eliminar abono"
        description="Esta acción no se puede deshacer."
        size="sm"
      >
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmDeleteId(null)}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" size="sm" className="flex-1" loading={isPending} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Dialog>
    </>
  );
}
