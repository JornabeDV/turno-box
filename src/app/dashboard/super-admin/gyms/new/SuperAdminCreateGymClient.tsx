"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { createGymWithAdminAction } from "@/actions/super-admin";
import {
  Copy,
  Check,
  Link as LinkIcon,
  WarningCircle,
  CheckCircle,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";

const inputClass =
  "w-full h-12 md:h-14 rounded-[2px] bg-page border border-border px-3.5 md:px-4 text-sm md:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand transition-colors";

const labelClass =
  "text-xs md:text-sm font-medium text-secondary uppercase tracking-wider";

export function SuperAdminCreateGymClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    gymId: string;
    slug: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createGymWithAdminAction(fd);
      if (res.success) {
        toast.success("Gimnasio y admin creados exitosamente");
        setSuccess(res.data);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  }

  async function handleCopyInvite() {
    if (!success) return;
    const url = `${window.location.origin}/join/${success.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Datos del Gimnasio ── */}
        <div className="bg-card border border-border p-5 md:p-6 lg:p-8 space-y-4 md:space-y-5">
          <h3 className="text-sm md:text-base font-semibold text-secondary uppercase tracking-wider flex-1">
            Datos del gimnasio
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelClass}>Nombre del gimnasio *</label>
              <input
                name="gymName"
                required
                className={inputClass}
                placeholder="CrossFit Norte"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelClass}>Slug *</label>
              <input
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                className={inputClass}
                placeholder="crossfit-norte"
              />
              <p className="text-[11px] md:text-sm text-muted">
                Solo letras minúsculas, números y guiones. Ej: crossfit-norte
              </p>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Dirección</label>
              <input
                name="address"
                className={inputClass}
                placeholder="Av. Corrientes 1234, CABA"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Teléfono</label>
              <input
                name="phone"
                className={inputClass}
                placeholder="+54 11 1234-5678"
              />
            </div>
          </div>
        </div>

        {/* ── Datos del Admin ── */}
        <div className="bg-card border border-border p-5 md:p-6 lg:p-8 space-y-4 md:space-y-5">
          <h3 className="text-sm md:text-base font-semibold text-secondary uppercase tracking-wider flex-1">
            Datos del administrador
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelClass}>Nombre completo *</label>
              <input
                name="adminName"
                required
                className={inputClass}
                placeholder="Jorge Pérez"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelClass}>Email *</label>
              <input
                name="adminEmail"
                type="email"
                required
                className={inputClass}
                placeholder="admin@crossfitnorte.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Contraseña temporal *</label>
              <div className="relative">
                <input
                  name="adminPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className={`${inputClass} pr-11`}
                  placeholder="Mínimo 6 caracteres"
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
              <label className={labelClass}>Confirmar contraseña *</label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className={`${inputClass} pr-11`}
                  placeholder="Repetí la contraseña"
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
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 border-l-2 border-danger bg-card px-3 py-2.5">
            <WarningCircle size={15} className="text-danger shrink-0" />
            <p className="text-xs md:text-sm text-danger font-[family-name:var(--font-oswald)] uppercase tracking-wide">
              {error}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="brand"
            loading={isPending}
            className="min-w-40"
          >
            Crear gimnasio y admin
          </Button>
        </div>
      </form>

      {/* ── Éxito: mostrar link de invitación ── */}
      {success && (
        <div className="bg-card border border-success/30 p-5 md:p-6 lg:p-8 space-y-4 md:space-y-5">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-success md:size-5" />
            <h3 className="text-sm md:text-base font-semibold text-primary">
              Gimnasio creado exitosamente
            </h3>
          </div>

          <p className="text-xs md:text-sm text-secondary">
            Compartí este link con los alumnos del gimnasio para que se
            registren automáticamente vinculados:
          </p>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 bg-page border border-border px-3.5 md:px-4 h-12 md:h-14 rounded-[2px]">
                <LinkIcon
                  size={14}
                  className="text-muted shrink-0 md:size-4"
                />
                <span className="text-sm md:text-base text-primary truncate">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/join/${success.slug}`
                    : `/join/${success.slug}`}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyInvite}
              className="shrink-0"
            >
              {copied ? (
                <Check size={16} className="text-success" />
              ) : (
                <Copy size={16} />
              )}
              <span className="hidden sm:inline ml-1.5">
                {copied ? "Copiado" : "Copiar"}
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
