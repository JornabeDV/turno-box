"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types";

const DAYS = [
  { value: "MONDAY",    label: "Lunes" },
  { value: "TUESDAY",   label: "Martes" },
  { value: "WEDNESDAY", label: "Miércoles" },
  { value: "THURSDAY",  label: "Jueves" },
  { value: "FRIDAY",    label: "Viernes" },
  { value: "SATURDAY",  label: "Sábado" },
  { value: "SUNDAY",    label: "Domingo" },
];

const CLASS_COLORS = [
  "#f97316", // naranja — CrossFit WOD
  "#10b981", // verde — Weightlifting
  "#3b82f6", // azul — Open Box
  "#8b5cf6", // violeta — Yoga / Mobility
  "#f43f5e", // rosa — HIIT
  "#f59e0b", // amber — Cardio
];

type Coach = { id: string; name: string | null };
type Discipline = { id: string; name: string; color: string | null };

type Props = {
  coaches: Coach[];
  disciplines: Discipline[];
  action: (formData: FormData) => Promise<ActionResult | void>;
  defaultValues?: {
    description?: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    maxCapacity?: number;
    color?: string;
    coachId?: string;
    disciplineId?: string;
  };
};

const inputClass =
  "w-full h-11 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors";

const labelClass = "text-xs font-medium text-zinc-400 uppercase tracking-wider";

export function ClassForm({ coaches, disciplines, action, defaultValues }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(defaultValues?.color ?? CLASS_COLORS[0]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("color", selectedColor);
    const result = await action(formData);
    setPending(false);
    if (result && !result.success) {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 space-y-5">
      {/* Descripción */}
      <div className="space-y-1.5">
        <label htmlFor="description" className={labelClass}>Descripción <span className="text-zinc-600 normal-case">(opcional)</span></label>
        <textarea
          id="description" name="description" rows={2}
          defaultValue={defaultValues?.description}
          placeholder="Descripción de la clase..."
          className={cn(inputClass, "h-auto py-2.5 resize-none")}
        />
      </div>

      {/* Día */}
      <div className="space-y-1.5">
        <label htmlFor="dayOfWeek" className={labelClass}>Día</label>
        <select
          id="dayOfWeek" name="dayOfWeek" required
          defaultValue={defaultValues?.dayOfWeek ?? "MONDAY"}
          className={inputClass}
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Horario */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="startTime" className={labelClass}>Inicio</label>
          <input
            id="startTime" name="startTime" type="time" required
            defaultValue={defaultValues?.startTime ?? "07:00"}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="endTime" className={labelClass}>Fin</label>
          <input
            id="endTime" name="endTime" type="time" required
            defaultValue={defaultValues?.endTime ?? "08:00"}
            className={inputClass}
          />
        </div>
      </div>

      {/* Cupo */}
      <div className="space-y-1.5">
        <label htmlFor="maxCapacity" className={labelClass}>Cupo máximo</label>
        <input
          id="maxCapacity" name="maxCapacity" type="number"
          min={1} max={100} required
          defaultValue={defaultValues?.maxCapacity ?? 12}
          className={inputClass}
        />
      </div>

      {/* Coach */}
      {coaches.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor="coachId" className={labelClass}>Coach <span className="text-zinc-600 normal-case">(opcional)</span></label>
          <select
            id="coachId" name="coachId"
            defaultValue={defaultValues?.coachId ?? ""}
            className={inputClass}
          >
            <option value="">Sin asignar</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Disciplina */}
      <div className="space-y-1.5">
        <label htmlFor="disciplineId" className={labelClass}>Disciplina</label>
        <select
          id="disciplineId" name="disciplineId" required
          defaultValue={defaultValues?.disciplineId ?? ""}
          className={inputClass}
        >
          <option value="" disabled>Selcciona una disciplina</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <span className={labelClass}>Color identificador</span>
        <div className="flex gap-2">
          {CLASS_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={cn(
                "size-8 rounded-full transition-all",
                selectedColor === color && "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2.5">
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="ghost" size="md" onClick={() => history.back()}>
          Cancelar
        </Button>
        <Button type="submit" variant="brand" size="md" loading={pending} fullWidth>
          {defaultValues ? "Guardar cambios" : "Crear clase"}
        </Button>
      </div>
    </form>
  );
}
