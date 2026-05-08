"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SelectInput } from "@/components/ui/Select";
import { updateGymSettingsAction } from "@/actions/gym";

type GymSettings = {
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  cancelWindowHours: number;
  waitlistEnabled: boolean;
};

const inputClass =
  "w-full h-10 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors";

const labelClass =
  "text-xs font-medium text-[#6B8A99] uppercase tracking-wider";

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Sección: Datos del Gimnasio ─────────────────────────────────── */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#EAEAEA]">
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
              placeholder="Bee Box CrossFit"
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

          {/* Logo URL */}
          <div className="space-y-1.5 sm:col-span-2 hidden">
            <label className={labelClass}>URL del logo</label>
            <input
              name="logoUrl"
              value={form.logoUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, logoUrl: e.target.value }))
              }
              className={inputClass}
              placeholder="https://..."
              type="url"
            />
          </div>
        </div>
      </div>

      {/* ── Sección: Reservas ───────────────────────────────────────────── */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#EAEAEA]">Reservas</h3>

        {/* Ventana de cancelación */}
        <div className="space-y-1.5 md:flex items-center justify-between">
          <div>
            <label className={labelClass}>
              Ventana de cancelación con reembolso
            </label>
            <p className="text-xs text-[#6B8A99]">
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
            <p className="text-sm text-[#EAEAEA] font-medium">
              Lista de espera
            </p>
            <p className="text-xs text-[#6B8A99] mt-0.5">
              Cuando está activa, los alumnos pueden anotarse en espera si la
              clase está llena.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({ ...f, waitlistEnabled: !f.waitlistEnabled }))
            }
            className={cn(
              "text-xs cursor-pointer font-medium px-3 py-1.5 rounded-[2px] border transition-all active:scale-95 shrink-0 ml-4",
              form.waitlistEnabled
                ? "border-rose-500/30 text-[#E61919] hover:bg-[#E61919]/10"
                : "border-emerald-500/30 text-[#27C7B8] hover:bg-[#27C7B8]/10",
            )}
          >
            {form.waitlistEnabled ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>

      {/* ── Guardar ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="brand"
          loading={isPending}
          className="min-w-32"
        >
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
