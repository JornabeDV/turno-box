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
      <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden divide-y divide-[#1A4A63]">
        {packs.map((pack) => (
          <div
            key={pack.id}
            onClick={() => setEditing(pack)}
            className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors group"
          >
            {/* Credits circle */}
            <div
              className={cn(
                "size-10 rounded-[2px] border flex flex-col items-center justify-center shrink-0",
                pack.isActive
                  ? "bg-[#F78837]/10 border-[#F78837]/20"
                  : "bg-[#0A1F2A] border-[#1A4A63]",
              )}
            >
              <span
                className={cn(
                  "text-base font-black leading-none",
                  pack.isActive ? "text-[#F78837]" : "text-[#4A6B7A]",
                )}
              >
                {pack.credits}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  pack.isActive ? "text-[#EAEAEA]" : "text-[#6B8A99]",
                )}
              >
                {pack.name}
              </p>
              <p className="text-xs text-[#4A6B7A] font-mono tabular-nums">
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: pack.currency,
                  maximumFractionDigits: 0,
                }).format(Number(pack.price))}
                {pack.validityDays
                  ? ` · ${pack.validityDays}d`
                  : " · sin vencimiento"}
              </p>
            </div>

            {/* Ventas */}
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-xs font-mono font-bold text-[#EAEAEA] tabular-nums">
                {pack._count.payments}
              </p>
              <p className="text-[10px] text-[#4A6B7A]">ventas</p>
            </div>

            {/* Toggle */}
            <div onClick={(e) => e.stopPropagation()}>
              <PackToggleButton
                packId={pack.id}
                initialIsActive={pack.isActive}
              />
            </div>

            {/* Eliminar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteId(pack.id);
              }}
              className="size-8 rounded-[2px] flex items-center justify-center text-[#6B8A99] cursor-pointer hover:text-[#E61919] hover:bg-[#0E2A38] transition-all shrink-0"
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setConfirmDeleteId(null)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="flex-1"
            loading={isPending}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>
    </>
  );
}
