"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { updatePackAction } from "@/actions/payments";

const inputClass =
  "w-full h-12 rounded-[2px] bg-page border border-border px-3.5 text-sm sm:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand transition-colors";

const labelClass =
  "text-xs sm:text-sm font-medium text-secondary uppercase tracking-wider";

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
  const router = useRouter();
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
        toast.success("Abono guardado");
        router.refresh();
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
          <label htmlFor="edit-pack-name" className={labelClass}>
            Nombre
          </label>
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
            <label htmlFor="edit-pack-credits" className={labelClass}>
              Clases
            </label>
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
            <label htmlFor="edit-pack-price" className={labelClass}>
              Precio (ARS)
            </label>
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
            <label htmlFor="edit-pack-order" className={labelClass}>
              Orden
            </label>
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
          <div className="rounded-[2px] bg-danger/10 border border-danger/20 px-3 py-2">
            <p className="text-xs md:text-sm text-danger">{error}</p>
          </div>
        )}

        <div className="flex max-md:flex-col gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="md:flex-1"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="md"
            className="md:flex-1"
            loading={isPending}
          >
            Guardar cambios
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
