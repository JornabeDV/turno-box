"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { createGymWithAdminAction } from "@/actions/super-admin";
import { Copy, Check, Link as LinkIcon, WarningCircle, CheckCircle } from "@phosphor-icons/react";

const inputClass =
  "w-full h-10 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors";

const labelClass =
  "text-xs font-medium text-[#6B8A99] uppercase tracking-wider";

export function SuperAdminCreateGymClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ gymId: string; slug: string } | null>(null);
  const [copied, setCopied] = useState(false);

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
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#EAEAEA]">
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
              <p className="text-[11px] text-[#4A6B7A]">
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
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#EAEAEA]">
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
              <input
                name="adminPassword"
                type="password"
                required
                minLength={6}
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Confirmar contraseña *</label>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className={inputClass}
                placeholder="Repetí la contraseña"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 border-l-2 border-[#E61919] bg-[#0E2A38] px-3 py-2.5">
            <WarningCircle size={15} className="text-[#E61919] shrink-0" />
            <p className="text-xs text-[#E61919] font-[family-name:var(--font-oswald)] uppercase tracking-wide">
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
        <div className="bg-[#0E2A38] border border-[#27C7B8]/30 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-[#27C7B8]" />
            <h3 className="text-sm font-semibold text-[#EAEAEA]">
              Gimnasio creado exitosamente
            </h3>
          </div>

          <p className="text-xs text-[#6B8A99]">
            Compartí este link con los alumnos del gimnasio para que se registren
            automáticamente vinculados:
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 bg-[#0A1F2A] border border-[#1A4A63] px-3.5 h-10 rounded-[2px]">
                <LinkIcon size={14} className="text-[#4A6B7A] shrink-0" />
                <span className="text-sm text-[#EAEAEA] truncate">
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
                <Check size={16} className="text-[#27C7B8]" />
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
