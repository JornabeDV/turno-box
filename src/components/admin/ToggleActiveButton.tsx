"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types";

type Props = {
  userId: string;
  initialIsActive: boolean;
  entityLabel: string; // "alumno" | "coach" | "abono"
  action: (id: string) => Promise<ActionResult<{ isActive: boolean }>>;
  fullWidth?: boolean;
  className?: string;
};

export function ToggleActiveButton({
  userId,
  initialIsActive,
  entityLabel,
  action,
  fullWidth = false,
  className,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(initialIsActive);

  useEffect(() => {
    setIsActive(initialIsActive);
  }, [initialIsActive]);

  function handleOpen() {
    setError(null);
    setOpen(true);
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await action(userId);
      if (res.success) {
        setIsActive(res.data.isActive);
        setOpen(false);
        toast.success(
          res.data.isActive
            ? `${entityLabel} activado`
            : `${entityLabel} desactivado`,
        );
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo completar la acción");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={isActive ? "danger" : "success"}
        size="md"
        onClick={handleOpen}
        disabled={isPending}
        fullWidth={fullWidth}
        className={cn(className)}
      >
        {isActive ? "Desactivar" : "Activar"}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setOpen(false);
            setError(null);
          }
        }}
        title={isActive ? "Desactivar" : "Activar"}
        description={
          isActive
            ? `¿Desactivar este ${entityLabel}?`
            : `¿Reactivar este ${entityLabel}?`
        }
        size="sm"
      >
        {error && (
          <div className="mb-4 rounded-[2px] bg-[#E61919]/10 border border-[#E61919]/20 px-3 py-2">
            <p className="text-xs md:text-sm text-[#E61919]">{error}</p>
          </div>
        )}
        <div className="flex max-md:flex-col gap-2 max-md:mt-6">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="md:flex-1"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={isActive ? "danger" : "success"}
            size="md"
            className="md:flex-1"
            loading={isPending}
            onClick={handleConfirm}
          >
            {isActive ? "Desactivar" : "Activar"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
