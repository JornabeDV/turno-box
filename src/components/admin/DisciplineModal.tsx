"use client";

import { useRef, useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { createDisciplineAction, updateDisciplineAction } from "@/actions/disciplines";

const COLORS = [
  "#f97316", // naranja
  "#10b981", // verde
  "#3b82f6", // azul
  "#8b5cf6", // violeta
  "#f43f5e", // rosa
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#84cc16", // lima
];

const inputClass =
  "w-full h-10 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors";

const labelClass = "text-xs font-medium text-zinc-400 uppercase tracking-wider";

export type DisciplineData = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  discipline?: DisciplineData; // undefined = crear, defined = editar
}

export function DisciplineModal({ open, onClose, discipline }: Props) {
  const isEditing = !!discipline;
  const [color, setColor] = useState(discipline?.color ?? COLORS[0]);
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
          await updateDisciplineAction(discipline.id, formData);
        } else {
          await createDisciplineAction(formData);
        }
        formRef.current?.reset();
        setColor(COLORS[0]);
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
      title={isEditing ? "Editar disciplina" : "Nueva disciplina"}
      size="sm"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div className="space-y-1.5">
          <label htmlFor="disc-name" className={labelClass}>Nombre</label>
          <input
            id="disc-name"
            name="name"
            type="text"
            required
            defaultValue={discipline?.name}
            placeholder="CrossFit, Weightlifting..."
            className={inputClass}
            autoFocus
          />
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <label htmlFor="disc-description" className={labelClass}>
            Descripción <span className="text-zinc-600 normal-case">(opcional)</span>
          </label>
          <input
            id="disc-description"
            name="description"
            type="text"
            defaultValue={discipline?.description ?? ""}
            placeholder="Breve descripción..."
            className={inputClass}
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <span className={labelClass}>Color</span>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
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
