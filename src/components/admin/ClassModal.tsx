"use client";

import { useRef, useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { createClassAction, updateClassAction } from "@/actions/classes";

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
type Discipline = { id: string; name: string; color: string | null; description: string | null };

export type ClassData = {
  id: string;
  description: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  color: string | null;
  coachId: string | null;
  disciplineId: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  class?: ClassData; // undefined = crear, defined = editar
  coaches: Coach[];
  disciplines: Discipline[];
}

const inputClass =
  "w-full h-10 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors";

const selectClass =
  "w-full h-10 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors";

const labelClass = "text-xs font-medium text-zinc-400 uppercase tracking-wider";

export function ClassModal({ open, onClose, class: gymClass, coaches, disciplines }: Props) {
  const isEditing = !!gymClass;
  const [color, setColor] = useState(gymClass?.color ?? CLASS_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleClose() {
    setError(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("color", color);

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateClassAction(gymClass.id, formData);
        } else {
          await createClassAction(formData);
        }
        formRef.current?.reset();
        setColor(CLASS_COLORS[0]);
        handleClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && handleClose()}
      title={isEditing ? "Editar clase" : "Nueva clase"}
      size="md"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Disciplina */}
        <div className="space-y-1.5">
          <label htmlFor="disciplineId" className={labelClass}>Disciplina</label>
          <select
            id="disciplineId"
            name="disciplineId"
            required
            defaultValue={gymClass?.disciplineId}
            className={selectClass}
          >
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Día */}
        <div className="space-y-1.5">
          <label htmlFor="dayOfWeek" className={labelClass}>Día</label>
          <select
            id="dayOfWeek"
            name="dayOfWeek"
            required
            defaultValue={gymClass?.dayOfWeek ?? "MONDAY"}
            className={selectClass}
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
              id="startTime"
              name="startTime"
              type="time"
              required
              defaultValue={gymClass?.startTime ?? "07:00"}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="endTime" className={labelClass}>Fin</label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              required
              defaultValue={gymClass?.endTime ?? "08:00"}
              className={inputClass}
            />
          </div>
        </div>

        {/* Cupo */}
        <div className="space-y-1.5">
          <label htmlFor="maxCapacity" className={labelClass}>Cupo máximo</label>
          <input
            id="maxCapacity"
            name="maxCapacity"
            type="number"
            min={1}
            max={100}
            required
            defaultValue={gymClass?.maxCapacity ?? 12}
            className={inputClass}
          />
        </div>

        {/* Coach */}
        {coaches.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="coachId" className={labelClass}>
              Coach <span className="text-zinc-600 normal-case">(opcional)</span>
            </label>
            <select
              id="coachId"
              name="coachId"
              defaultValue={gymClass?.coachId ?? ""}
              className={selectClass}
            >
              <option value="">Sin asignar</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Descripción */}
        <div className="space-y-1.5">
          <label htmlFor="description" className={labelClass}>
            Descripción <span className="text-zinc-600 normal-case">(opcional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={gymClass?.description ?? ""}
            placeholder="Descripción de la clase..."
            className={`${inputClass} h-auto py-2.5 resize-none`}
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <span className={labelClass}>Color identificador</span>
          <div className="flex flex-wrap gap-2">
            {CLASS_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="size-7 rounded-full transition-all"
                style={{
                  backgroundColor: c,
                  boxShadow: color === c ? `0 0 0 2px #18181b, 0 0 0 4px ${c}` : undefined,
                  transform: color === c ? "scale(1.15)" : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="brand" size="sm" loading={isPending} className="flex-1">
            {isEditing ? "Guardar" : "Crear"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}