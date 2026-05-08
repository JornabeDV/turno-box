"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { createCoachAction } from "@/actions/coaches";

const inputClass =
  "w-full h-10 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors";

const labelClass =
  "text-xs font-medium text-[#6B8A99] uppercase tracking-wider";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateCoachModal({ open, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    setError(null);
    formRef.current?.reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createCoachAction(formData);
      if (result.success) {
        toast.success("Coach creado");
        handleClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && handleClose()}
      title="Agregar coach"
      size="sm"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="coach-name" className={labelClass}>
            Nombre
          </label>
          <input
            id="coach-name"
            name="name"
            type="text"
            required
            placeholder="Juan Pérez"
            className={inputClass}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="coach-email" className={labelClass}>
            Email
          </label>
          <input
            id="coach-email"
            name="email"
            type="email"
            required
            placeholder="coach@gimnasio.com"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="coach-password" className={labelClass}>
            Contraseña
          </label>
          <input
            id="coach-password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className={inputClass}
          />
        </div>

        {error && (
          <div className="rounded-[2px] bg-[#E61919]/10 border border-[#E61919]/20 px-3 py-2">
            <p className="text-xs text-[#E61919]">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="sm"
            className="flex-1"
            loading={isPending}
          >
            Crear coach
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
