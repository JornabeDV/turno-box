"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { createPackAction } from "@/actions/payments";

const inputClass =
  "w-full h-12 rounded-[2px] bg-page border border-border px-3.5 text-sm sm:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand transition-colors";

const labelClass =
  "text-xs sm:text-sm font-medium text-secondary uppercase tracking-wider";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreatePackModal({ open, onClose }: Props) {
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
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createPackAction(formData);
      if (result.success) {
        toast.success("Abono creado");
        router.refresh();
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
      size="md"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="pack-name" className={labelClass}>
            Nombre
          </label>
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
            <label htmlFor="pack-credits" className={labelClass}>
              Clases
            </label>
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
            <label htmlFor="pack-price" className={labelClass}>
              Precio (ARS)
            </label>
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
            <span className="text-muted normal-case font-normal">
              — vacío = sin vencimiento
            </span>
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
            Crear abono
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
