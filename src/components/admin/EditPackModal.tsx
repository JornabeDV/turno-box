"use client";

import { useRef, useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { updatePackAction } from "@/actions/payments";

const inputClass =
  "w-full h-10 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors";

const labelClass = "text-xs font-medium text-zinc-400 uppercase tracking-wider";

export type PackData = {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  validityDays: number | null;
  sortOrder: number;
};

interface Props {
  pack: PackData | null;
  onClose: () => void;
}

export function EditPackModal({ pack, onClose }: Props) {
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
    if (!pack) return;
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updatePackAction(pack.id, formData);
      if (result.success) {
        handleClose();
      } else {
        setError(result.error ?? "Error al guardar.");
      }
    });
  }

  return (
    <Dialog
      open={!!pack}
      onOpenChange={(o) => !o && handleClose()}
      title="Editar abono"
      size="sm"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="edit-pack-name" className={labelClass}>Nombre</label>
          <input
            id="edit-pack-name"
            key={pack?.id + "-name"}
            name="name"
            type="text"
            required
            defaultValue={pack?.name ?? ""}
            placeholder="Abono 8 clases"
            className={inputClass}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="edit-pack-credits" className={labelClass}>Clases</label>
            <input
              id="edit-pack-credits"
              key={pack?.id + "-credits"}
              name="credits"
              type="number"
              required
              min={1}
              max={100}
              defaultValue={pack?.credits ?? ""}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-pack-price" className={labelClass}>Precio (ARS)</label>
            <input
              id="edit-pack-price"
              key={pack?.id + "-price"}
              name="price"
              type="number"
              required
              min={0}
              defaultValue={pack?.price ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="edit-pack-validity" className={labelClass}>
              Validez (días)
            </label>
            <input
              id="edit-pack-validity"
              key={pack?.id + "-validity"}
              name="validityDays"
              type="number"
              min={1}
              defaultValue={pack?.validityDays ?? ""}
              placeholder="Sin vencimiento"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-pack-order" className={labelClass}>Orden</label>
            <input
              id="edit-pack-order"
              key={pack?.id + "-order"}
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={pack?.sortOrder ?? 0}
              className={inputClass}
            />
          </div>
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
            Guardar cambios
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
