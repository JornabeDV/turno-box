"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { TimePicker } from "@/components/ui/TimePicker";
import { SelectInput } from "@/components/ui/Select";
import { createClassAction, updateClassAction } from "@/actions/classes";

const DAYS = [
  { value: "MONDAY", label: "Lunes" },
  { value: "TUESDAY", label: "Martes" },
  { value: "WEDNESDAY", label: "Miércoles" },
  { value: "THURSDAY", label: "Jueves" },
  { value: "FRIDAY", label: "Viernes" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
];

type Coach = { id: string; name: string | null };
type Discipline = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
};

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
  "w-full h-10 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors";

const selectClass =
  "w-full h-10 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm text-[#EAEAEA] focus:outline-none focus:border-[#F78837] transition-colors";

const labelClass =
  "text-xs font-medium text-[#6B8A99] uppercase tracking-wider";

export function ClassModal({
  open,
  onClose,
  class: gymClass,
  coaches,
  disciplines,
}: Props) {
  const isEditing = !!gymClass;
  const [disciplineId, setDisciplineId] = useState(
    gymClass?.disciplineId ?? "",
  );
  const [dayOfWeek, setDayOfWeek] = useState(gymClass?.dayOfWeek ?? "MONDAY");
  const [coachId, setCoachId] = useState(gymClass?.coachId ?? "");
  const [startTime, setStartTime] = useState(gymClass?.startTime ?? "07:00");

  function addOneHour(time: string): string {
    const [h, m] = time.split(":").map(Number);
    const end = new Date(0, 0, 0, h + 1, m);
    return `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
  }
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
    formData.set("disciplineId", disciplineId);
    formData.set("dayOfWeek", dayOfWeek);
    formData.set("coachId", coachId);
    formData.set("startTime", startTime);
    formData.set("endTime", addOneHour(startTime));
    const selectedDiscipline = disciplines.find((d) => d.id === disciplineId);
    if (selectedDiscipline?.color)
      formData.set("color", selectedDiscipline.color);

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateClassAction(gymClass.id, formData);
          toast.success("Clase guardada");
        } else {
          await createClassAction(formData);
          toast.success("Clase creada");
        }
        formRef.current?.reset();
        setDisciplineId(disciplines[0]?.id ?? "");
        setDayOfWeek("MONDAY");
        setStartTime("07:00");
        setCoachId("");
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
        <SelectInput
          name="disciplineId"
          value={disciplineId}
          onChange={setDisciplineId}
          options={disciplines.map((d) => ({ value: d.id, label: d.name }))}
          label="Disciplina"
          required
        />

        {/* Día */}
        <SelectInput
          name="dayOfWeek"
          value={dayOfWeek}
          onChange={setDayOfWeek}
          options={DAYS}
          label="Día"
          required
        />

        {/* Horario */}
        <TimePicker label="Inicio" value={startTime} onChange={setStartTime} />
        <input type="hidden" name="startTime" value={startTime} />
        <input type="hidden" name="endTime" value={addOneHour(startTime)} />

        {/* Cupo */}
        <div className="space-y-1.5">
          <label htmlFor="maxCapacity" className={labelClass}>
            Cupo máximo
          </label>
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
          <SelectInput
            name="coachId"
            value={coachId}
            onChange={setCoachId}
            options={[
              { value: "", label: "Sin asignar" },
              ...coaches.map((c) => ({
                value: c.id,
                label: c.name || "Sin nombre",
              })),
            ]}
            label="Coach (opcional)"
          />
        )}

        {/* Descripción */}
        <div className="space-y-1.5">
          <label htmlFor="description" className={labelClass}>
            Descripción{" "}
            <span className="text-[#4A6B7A] normal-case">(opcional)</span>
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

        {error && (
          <div className="rounded-[2px] bg-[#E61919]/10 border border-[#E61919]/20 px-3 py-2">
            <p className="text-xs text-[#E61919]">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="sm"
            loading={isPending}
            className="flex-1"
          >
            {isEditing ? "Guardar" : "Crear"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
