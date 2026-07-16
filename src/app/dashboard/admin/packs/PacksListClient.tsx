"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  activeUsers: number;
};

interface Props {
  packs: PackRow[];
}

export function PacksListClient({ packs }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<PackData | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirmDeleteId) return;
    startTransition(async () => {
      const res = await deletePackAction(confirmDeleteId);
      if (res.success) {
        setConfirmDeleteId(null);
        toast.success("Abono eliminado");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <div className="bg-card border border-border overflow-hidden divide-y divide-border">
        {packs.map((pack) => (
          <div
            key={pack.id}
            onClick={() => setEditing(pack)}
            className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 cursor-pointer hover:bg-white/[0.03] transition-colors group"
          >
            {/* Credits circle */}
            <div
              className={cn(
                "size-10 rounded-[2px] border flex flex-col items-center justify-center shrink-0",
                pack.isActive
                  ? "bg-brand/10 border-brand/20"
                  : "bg-page border-border",
              )}
            >
              <span
                className={cn(
                  "text-base font-black leading-none",
                  pack.isActive ? "text-brand" : "text-muted",
                )}
              >
                {pack.credits}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm md:text-base font-medium truncate",
                  pack.isActive ? "text-primary" : "text-secondary",
                )}
              >
                {pack.name}
              </p>
              <p className="text-xs md:text-sm text-muted font-mono tabular-nums">
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

            {/* Alumnos activos */}
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-xs md:text-sm font-mono font-bold text-primary tabular-nums">
                {pack.activeUsers}
              </p>
              <p className="text-xs md:text-sm text-muted">activos</p>
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
              className="size-8 rounded-[2px] flex items-center justify-center text-secondary cursor-pointer hover:text-danger hover:bg-card transition-all shrink-0"
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
        size="md"
      >
        <div className="flex max-md:flex-col gap-2 max-md:mt-6">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="md:flex-1"
            onClick={() => setConfirmDeleteId(null)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            className="md:flex-1"
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
