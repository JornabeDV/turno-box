"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import {
  pauseAllCreditsAction,
  resumeAllCreditsAction,
} from "@/actions/freezes";
import { PauseIcon, PlayIcon, WarningCircle } from "@phosphor-icons/react";

type Props = {
  initialIsPaused: boolean;
};

export function GlobalFreezeButton({ initialIsPaused }: Props) {
  const [isPaused, setIsPaused] = useState(initialIsPaused);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setError(null);
    setReason("");
    setOpen(true);
  }

  function handlePause() {
    setError(null);
    startTransition(async () => {
      const res = await pauseAllCreditsAction(reason);
      if (res.success) {
        setIsPaused(true);
        setOpen(false);
        toast.success(`Pausa masiva activada — ${res.data.affectedCount} abonos congelados`);
      } else {
        setError(res.error ?? "No se pudo activar la pausa masiva");
        toast.error(res.error ?? "No se pudo activar la pausa masiva");
      }
    });
  }

  function handleResume() {
    setError(null);
    startTransition(async () => {
      const res = await resumeAllCreditsAction();
      if (res.success) {
        setIsPaused(false);
        toast.success(`Pausa masiva finalizada — ${res.data.affectedCount} abonos reanudados`);
      } else {
        setError(res.error ?? "No se pudo finalizar la pausa masiva");
        toast.error(res.error ?? "No se pudo finalizar la pausa masiva");
      }
    });
  }

  return (
    <>
      {isPaused ? (
        <Button
          type="button"
          variant="success"
          size="md"
          onClick={handleResume}
          disabled={isPending}
          className="gap-1.5"
        >
          <PlayIcon size={14} weight="fill" />
          Reanudar abonos
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline-brand"
          size="md"
          onClick={handleOpen}
          disabled={isPending}
          className="gap-1.5"
        >
          <PauseIcon size={14} weight="fill" />
          Pausar abonos
        </Button>
      )}

      {error && !open && (
        <div className="mt-2 rounded-[2px] bg-danger/10 border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setOpen(false);
            setError(null);
          }
        }}
        title="Pausar todos los abonos"
        description="Todos los abonos activos del gimnasio dejarán de vencer hasta que se reanude."
        size="md"
      >
        <div className="space-y-4 max-sm:mt-4">
          <div className="flex items-start gap-2 rounded-[2px] bg-brand/10 border border-brand/20 px-3 py-2.5">
            <p className="text-xs sm:text-sm text-primary">
              Esta acción afecta a <strong>todos</strong> los alumnos. Usala para vacaciones del box o situaciones similares.
            </p>
          </div>

          <div>
            <label className="block text-[10px] md:text-xs text-muted uppercase tracking-wider mb-1.5">
              Motivo
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: vacaciones de invierno, cierre por reformas..."
              className="w-full h-12 bg-page border border-border rounded-[2px] px-3 text-sm sm:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-[2px] bg-danger/10 border border-danger/20 px-3 py-2">
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}

          <div className="flex max-md:flex-col gap-2">
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
              variant="brand"
              size="md"
              className="md:flex-1"
              loading={isPending}
              disabled={!reason.trim()}
              onClick={handlePause}
            >
              Pausar todos
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
