"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { updateGymAction } from "@/actions/super-admin";

const inputClass =
  "w-full h-12 md:h-14 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 md:px-4 text-sm sm:text-base text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors";

const labelClass =
  "text-xs sm:text-sm md:text-sm font-medium text-[#6B8A99] uppercase tracking-wider";

interface Props {
  open: boolean;
  onClose: () => void;
  gym: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    admin: { id: string; email: string } | null;
  };
}

export function EditGymModal({ open, onClose, gym }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      const result = await updateGymAction(gym.id, formData);
      if (result.success) {
        toast.success("Gimnasio actualizado");
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
      title="Editar gimnasio"
      size="lg"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="edit-gym-name" className={labelClass}>
            Nombre del gimnasio *
          </label>
          <input
            id="edit-gym-name"
            name="name"
            type="text"
            required
            defaultValue={gym.name}
            className={inputClass}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-gym-slug" className={labelClass}>
            Slug *
          </label>
          <input
            id="edit-gym-slug"
            name="slug"
            type="text"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            defaultValue={gym.slug}
            className={inputClass}
          />
          <p className="text-[11px] md:text-sm text-[#4A6B7A]">
            Solo letras minúsculas, números y guiones. Ej: crossfit-norte
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="edit-gym-address" className={labelClass}>
              Dirección
            </label>
            <input
              id="edit-gym-address"
              name="address"
              type="text"
              defaultValue={gym.address ?? ""}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-gym-phone" className={labelClass}>
              Teléfono
            </label>
            <input
              id="edit-gym-phone"
              name="phone"
              type="text"
              defaultValue={gym.phone ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div className="border-t border-[#1A4A63] pt-4 md:pt-5 space-y-4 md:space-y-5">
          <p className="text-xs md:text-sm font-medium text-[#6B8A99] uppercase tracking-wider">
            Administrador del gimnasio
          </p>

          <div className="space-y-1.5">
            <label htmlFor="edit-gym-admin-email" className={labelClass}>
              Email del admin
            </label>
            <input
              id="edit-gym-admin-email"
              name="adminEmail"
              type="email"
              defaultValue={gym.admin?.email ?? ""}
              placeholder="admin@gimnasio.com"
              className={inputClass}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="edit-gym-admin-password" className={labelClass}>
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="edit-gym-admin-password"
                  name="adminPassword"
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  placeholder="Dejar en blanco para no cambiar"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A6B7A] hover:text-[#EAEAEA] transition-colors p-1"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-gym-admin-confirm-password" className={labelClass}>
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="edit-gym-admin-confirm-password"
                  name="confirmAdminPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={6}
                  placeholder="Repetir nueva contraseña"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A6B7A] hover:text-[#EAEAEA] transition-colors p-1"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>
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
            Guardar cambios
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
