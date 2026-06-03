"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { updateCoachAction } from "@/actions/coaches";

const inputClass =
  "w-full h-12 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm sm:text-base text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors";

const labelClass =
  "text-xs sm:text-sm font-medium text-[#6B8A99] uppercase tracking-wider";

interface Props {
  open: boolean;
  onClose: () => void;
  coach: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function EditCoachModal({ open, onClose, coach }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClose() {
    setError(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateCoachAction(coach.id, formData);
      if (result.success) {
        toast.success("Coach actualizado");
        router.refresh();
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
      title="Editar coach"
      size="sm"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="edit-coach-name" className={labelClass}>
            Nombre
          </label>
          <input
            id="edit-coach-name"
            name="name"
            type="text"
            required
            defaultValue={coach.name ?? ""}
            placeholder="Juan Pérez"
            className={inputClass}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-coach-email" className={labelClass}>
            Email
          </label>
          <input
            id="edit-coach-email"
            name="email"
            type="email"
            required
            defaultValue={coach.email}
            placeholder="coach@gimnasio.com"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-coach-password" className={labelClass}>
            Nueva contraseña
          </label>
          <input
            id="edit-coach-password"
            name="password"
            type="password"
            minLength={6}
            placeholder="Dejar en blanco para no cambiar"
            className={inputClass}
          />
          <p className="text-[11px] text-[#4A6B7A]">
            Solo completá si querés cambiar la contraseña actual.
          </p>
        </div>

        {error && (
          <div className="rounded-[2px] bg-[#E61919]/10 border border-[#E61919]/20 px-3 py-2">
            <p className="text-xs md:text-sm text-[#E61919]">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1 max-sm:flex-col">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="sm:flex-1"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="md"
            className="sm:flex-1"
            loading={isPending}
          >
            Guardar cambios
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
