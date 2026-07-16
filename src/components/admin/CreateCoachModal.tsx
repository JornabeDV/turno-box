"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { createCoachAction } from "@/actions/coaches";
import { Eye, EyeSlash } from "@phosphor-icons/react";

const inputClass =
  "w-full h-12 rounded-[2px] bg-page border border-border px-3.5 text-sm sm:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand transition-colors";

const passwordInputClass =
  "w-full h-12 rounded-[2px] bg-page border border-border pl-3.5 pr-10 text-sm sm:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand transition-colors";

const labelClass =
  "text-xs sm:text-sm font-medium text-secondary uppercase tracking-wider";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateCoachModal({ open, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="coach-confirm-password" className={labelClass}>
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              id="coach-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Repetir contraseña"
              className={passwordInputClass}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-[2px] bg-danger/10 border border-danger/20 px-3 py-2">
            <p className="text-xs md:text-sm text-danger">{error}</p>
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
