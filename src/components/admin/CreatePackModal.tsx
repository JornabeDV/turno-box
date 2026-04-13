"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { createPackAction } from "@/actions/payments";

const inputClass =
  "w-full h-10 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors";

const labelClass = "text-xs font-medium text-zinc-400 uppercase tracking-wider";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreatePackModal({ open, onClose }: Props) {
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
      const result = await createPackAction(formData);
      if (result.success) {
        toast.success("Abono creado");
        handleClose();
      } else {
        setError(result.error ?? "Error al crear el abono.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && handleClose()}
      title="Nuevo abono"
      size="sm"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="pack-name" className={labelClass}>Nombre</label>
          <input
            id="pack-name"
            name="name"
            type="text"
            required
            placeholder="Abono 8 clases"
            className={inputClass}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="pack-credits" className={labelClass}>Clases</label>
            <input
              id="pack-credits"
              name="credits"
              type="number"
              required
              min={1}
              max={100}
              placeholder="8"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pack-price" className={labelClass}>Precio (ARS)</label>
            <input
              id="pack-price"
              name="price"
              type="number"
              required
              min={0}
              placeholder="15000"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pack-validity" className={labelClass}>
            Validez (días){" "}
            <span className="text-zinc-600 normal-case font-normal">— vacío = sin vencimiento</span>
          </label>
          <input
            id="pack-validity"
            name="validityDays"
            type="number"
            min={1}
            placeholder="30"
            className={inputClass}
          />
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand" size="sm" className="flex-1" loading={isPending}>
            Crear abono
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
