"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DatePicker";
import { createStudentAction } from "@/actions/students";

const inputClass =
  "w-full h-12 rounded-[2px] bg-page border border-border px-3.5 text-sm sm:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand transition-colors";

const labelClass =
  "text-xs sm:text-sm font-medium text-secondary uppercase tracking-wider";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateStudentModal({ open, onClose }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [birthDate, setBirthDate] = useState("");

  function handleClose() {
    setError(null);
    setBirthDate("");
    formRef.current?.reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createStudentAction(formData);
      if (result.success) {
        toast.success("Alumno creado e invitación enviada");
        router.refresh();
        handleClose();
      } else {
        setError(result.error ?? "Error al crear el alumno.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && handleClose()}
      title="Nuevo alumno"
      description="Creá la cuenta y se enviará una invitación por email para que elija su contraseña."
      size="md"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="student-name" className={labelClass}>
            Nombre <span className="text-danger">*</span>
          </label>
          <input
            id="student-name"
            name="name"
            type="text"
            required
            placeholder="Juan Pérez"
            className={inputClass}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="student-email" className={labelClass}>
            Email <span className="text-danger">*</span>
          </label>
          <input
            id="student-email"
            name="email"
            type="email"
            required
            placeholder="juan@email.com"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="student-phone" className={labelClass}>
            Teléfono
          </label>
          <input
            id="student-phone"
            name="phone"
            type="tel"
            placeholder="+54 9 11 1234-5678"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DateInput
            name="birthDate"
            value={birthDate}
            onChange={setBirthDate}
            label="Fecha de nacimiento"
            className="w-full"
            minAge={0}
            allowFuture={false}
          />
          <div className="space-y-1.5">
            <label htmlFor="student-credits" className={labelClass}>
              Créditos iniciales
            </label>
            <input
              id="student-credits"
              name="initialCredits"
              type="number"
              min={0}
              max={999}
              placeholder="0"
              defaultValue={0}
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-[2px] bg-danger/10 border border-danger/20 px-3 py-2">
            <p className="text-xs md:text-sm text-danger">{error}</p>
          </div>
        )}

        <div className="flex max-md:flex-col gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="md:flex-1"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="md"
            className="md:flex-1"
            loading={isPending}
          >
            Crear alumno
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
