"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import {
  pauseStudentCreditsAction,
  resumeStudentCreditsAction,
} from "@/actions/freezes";
import { cn } from "@/lib/utils";
import { PauseIcon, PlayIcon } from "@phosphor-icons/react";

type Props = {
  studentId: string;
  initialIsPaused: boolean;
  fullWidth?: boolean;
};

export function FreezeCreditsButton({
  studentId,
  initialIsPaused,
  fullWidth = false,
}: Props) {
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
      const res = await pauseStudentCreditsAction(studentId, reason);
      if (res.success) {
        setIsPaused(true);
        setOpen(false);
        toast.success("Abono pausado");
      } else {
        setError(res.error ?? "No se pudo pausar");
        toast.error(res.error ?? "No se pudo pausar");
      }
    });
  }

  function handleResume() {
    setError(null);
    startTransition(async () => {
      const res = await resumeStudentCreditsAction(studentId);
      if (res.success) {
        setIsPaused(false);
        toast.success("Abono reanudado");
      } else {
        setError(res.error ?? "No se pudo reanudar");
        toast.error(res.error ?? "No se pudo reanudar");
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
          fullWidth={fullWidth}
        >
          <PlayIcon size={14} weight="fill" />
          Reanudar
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline-brand"
          size="md"
          onClick={handleOpen}
          disabled={isPending}
          className="gap-1.5"
          fullWidth={fullWidth}
        >
          <PauseIcon size={14} weight="fill" />
          Pausar
        </Button>
      )}

      {error && !open && (
        <div className="mt-2 rounded-[2px] bg-[#E61919]/10 border border-[#E61919]/20 px-3 py-2">
          <p className="text-xs text-[#E61919]">{error}</p>
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
        title="Pausar abono"
        description="Los créditos de este alumno dejarán de vencer hasta que se reanude."
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] md:text-xs text-[#4A6B7A] uppercase tracking-wider mb-1.5">
              Motivo
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: lesión, viaje, vacaciones..."
              className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] rounded-[2px] px-3 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837]/50 transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-[2px] bg-[#E61919]/10 border border-[#E61919]/20 px-3 py-2">
              <p className="text-xs text-[#E61919]">{error}</p>
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
              Pausar abono
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
