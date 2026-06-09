"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { createCoachAction } from "@/actions/coaches";
import { Eye, EyeSlash } from "@phosphor-icons/react";

const inputClass =
  "w-full h-12 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm sm:text-base text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors";

const passwordInputClass =
  "w-full h-12 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] pl-3.5 pr-10 text-sm sm:text-base text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors";

const labelClass =
  "text-xs sm:text-sm font-medium text-[#6B8A99] uppercase tracking-wider";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateCoachModal({ open, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
        toast.success("Profesor creado");
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
      title="Agregar profesor"
      size="md"
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
            placeholder="profesor@gimnasio.com"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="coach-password" className={labelClass}>
            Contraseña
          </label>
          <div className="relative">
            <input
              id="coach-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className={passwordInputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
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
            Crear profesor
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
