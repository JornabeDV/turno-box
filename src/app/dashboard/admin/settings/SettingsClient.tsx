"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SelectInput } from "@/components/ui/Select";
import { updateGymSettingsAction } from "@/actions/gym";
import { changePasswordAction } from "@/actions/profile";
import { Copy, Check, Lock, Link as LinkIcon, Eye, EyeSlash, UploadSimple, X } from "@phosphor-icons/react";
import { PushNotificationToggle } from "@/components/profile/PushNotificationToggle";
import { PushNotificationHelp } from "@/components/profile/PushNotificationHelp";

type GymSettings = {
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  cancelWindowHours: number;
  waitlistEnabled: boolean;
  slug: string;
};

const inputClass =
  "w-full h-12 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm sm:text-base text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors";

const labelClass =
  "text-xs sm:text-sm font-medium text-[#6B8A99] uppercase tracking-wider";

export function SettingsClient({ gym }: { gym: GymSettings }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: gym.name,
    logoUrl: gym.logoUrl ?? "",
    address: gym.address ?? "",
    phone: gym.phone ?? "",
    cancelWindowHours: String(gym.cancelWindowHours),
    waitlistEnabled: gym.waitlistEnabled,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(gym.logoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [passwordPending, startPasswordTransition] = useTransition();
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  // Invite link state
  const [copied, setCopied] = useState(false);
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${gym.slug}`
      : `/join/${gym.slug}`;

  function handleSubmit(e: {
    preventDefault(): void;
    currentTarget: HTMLFormElement;
  }) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("waitlistEnabled", form.waitlistEnabled ? "true" : "false");

    startTransition(async () => {
      const res = await updateGymSettingsAction(fd);
      if (res.success) {
        toast.success("Configuración guardada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handlePasswordSubmit(e: {
    preventDefault(): void;
    currentTarget: HTMLFormElement;
  }) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startPasswordTransition(async () => {
      const res = await changePasswordAction(fd);
      if (res.success) {
        toast.success("Contraseña actualizada");
        setPasswordForm({ current: "", next: "", confirm: "" });
        (e.currentTarget as HTMLFormElement).reset();
      } else {
        toast.error(res.error);
      }
    });
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Link copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el link");
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Configuración del Gimnasio ─────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 space-y-4">
          <h3 className="text-sm md:text-base font-semibold text-[#EAEAEA]">
            Datos del gimnasio
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelClass}>Nombre *</label>
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className={inputClass}
                placeholder="Box Turno CrossFit"
              />
            </div>

            {/* Dirección */}
            <div className="space-y-1.5">
              <label className={labelClass}>Dirección</label>
              <input
                name="address"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                className={inputClass}
                placeholder="Av. Corrientes 1234, CABA"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label className={labelClass}>Teléfono</label>
              <input
                name="phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className={inputClass}
                placeholder="+54 11 1234-5678"
              />
            </div>

            {/* Logo upload */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelClass}>Logo del gimnasio</label>
              <input type="hidden" name="logoUrl" value={form.logoUrl} />
              <input
                ref={fileInputRef}
                type="file"
                name="logoFile"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file) {
                    setLogoFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setLogoPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />

              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative group">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 w-16 md:h-20 md:w-20 object-contain rounded-[2px] border border-[#1A4A63] bg-[#0A1F2A] p-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                        setForm((f) => ({ ...f, logoUrl: "" }));
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-[#F78837] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Quitar logo"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-[2px] border border-dashed border-[#4A6B7A] bg-[#0A1F2A] flex items-center justify-center text-[#4A6B7A]">
                    <span className="text-[10px] text-center leading-tight">Sin logo</span>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadSimple size={16} className="mr-1.5" />
                  {logoPreview ? "Cambiar logo" : "Subir logo"}
                </Button>
              </div>

              <p className="text-xs text-[#6B8A99]">
                Formatos: PNG, JPG, WEBP, SVG. Máximo 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* ── Sección: Reservas ───────────────────────────────────────────── */}
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 space-y-4">
          <h3 className="text-sm md:text-base font-semibold text-[#EAEAEA]">Reservas</h3>

          {/* Ventana de cancelación */}
          <div className="space-y-1.5 md:flex items-center justify-between">
            <div>
              <label className={labelClass}>
                Ventana de cancelación con reembolso
              </label>
              <p className="text-xs md:text-sm text-[#6B8A99]">
                El alumno puede cancelar y recuperar su crédito si faltan al menos
                este tiempo para que comience la clase.
              </p>
            </div>

            <SelectInput
              name="cancelWindowHours"
              value={form.cancelWindowHours}
              onChange={(v) => setForm((f) => ({ ...f, cancelWindowHours: v }))}
              options={[
                { value: "0.5", label: "30 minutos antes" },
                { value: "1", label: "1 hora antes" },
                { value: "2", label: "2 horas antes" },
              ]}
              className="w-48"
            />
          </div>

          {/* Lista de espera */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm md:text-base text-[#EAEAEA] font-medium">
                Lista de espera
              </p>
              <p className="text-xs md:text-sm text-[#6B8A99] mt-0.5">
                Cuando está activa, los alumnos pueden anotarse en espera si la
                clase está llena.
              </p>
            </div>
            <Button
              type="button"
              variant={form.waitlistEnabled ? "danger" : "success"}
              size="md"
              onClick={() =>
                setForm((f) => ({ ...f, waitlistEnabled: !f.waitlistEnabled }))
              }
              className="shrink-0 ml-4"
            >
              {form.waitlistEnabled ? "Desactivar" : "Activar"}
            </Button>
          </div>
        </div>

        {/* ── Guardar ─────────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="brand"
            loading={isPending}
            className="min-w-32"
            size="md"

          >
            Guardar cambios
          </Button>
        </div>
      </form>

      {/* ── Sección: Invitar alumnos ────────────────────────────────────── */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <LinkIcon size={16} className="text-[#F78837]" />
          <h3 className="text-sm md:text-base font-semibold text-[#EAEAEA]">
            Invitar alumnos
          </h3>
        </div>
        <p className="text-xs md:text-sm text-[#6B8A99]">
          Compartí este link con tus alumnos para que se registren y queden
          automáticamente vinculados a tu gimnasio.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 bg-[#0A1F2A] border border-[#1A4A63] px-3.5 h-12 rounded-[2px]">
              <LinkIcon size={14} className="text-[#4A6B7A] shrink-0" />
              <span className="text-sm md:text-base text-[#EAEAEA] truncate">
                {inviteUrl}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyLink}
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

      {/* ── Sección: Notificaciones ─────────────────────────────────────── */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 space-y-4">
        <h3 className="text-sm md:text-base font-semibold text-[#EAEAEA]">Notificaciones</h3>
        <PushNotificationToggle />
        <PushNotificationHelp />
      </div>

      {/* ── Sección: Cambiar contraseña ─────────────────────────────────── */}
      <form
        onSubmit={handlePasswordSubmit}
        className="bg-[#0E2A38] border border-[#1A4A63] p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-[#F78837]" />
          <h3 className="text-sm md:text-base font-semibold text-[#EAEAEA]">
            Cambiar contraseña
          </h3>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Contraseña actual</label>
            <div className="relative">
              <input
                name="current"
                type={showPassword.current ? "text" : "password"}
                required
                minLength={6}
                value={passwordForm.current}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, current: e.target.value }))
                }
                className={cn(inputClass, "pr-10")}
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((s) => ({ ...s, current: !s.current }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B8A99] hover:text-[#EAEAEA] transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword.current ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Nueva contraseña</label>
            <div className="relative">
              <input
                name="next"
                type={showPassword.next ? "text" : "password"}
                required
                minLength={6}
                value={passwordForm.next}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, next: e.target.value }))
                }
                className={cn(inputClass, "pr-10")}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((s) => ({ ...s, next: !s.next }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B8A99] hover:text-[#EAEAEA] transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword.next ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Confirmar nueva</label>
            <div className="relative">
              <input
                name="confirm"
                type={showPassword.confirm ? "text" : "password"}
                required
                minLength={6}
                value={passwordForm.confirm}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, confirm: e.target.value }))
                }
                className={cn(inputClass, "pr-10")}
                placeholder="Repetí la nueva"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((s) => ({ ...s, confirm: !s.confirm }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B8A99] hover:text-[#EAEAEA] transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword.confirm ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            variant="outline"
            loading={passwordPending}
            className="min-w-32"
          >
            Actualizar contraseña
          </Button>
        </div>
      </form>
    </div>
  );
}
