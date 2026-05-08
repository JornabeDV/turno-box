"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DatePicker";
import { updateProfileAction } from "@/actions/profile";

const inputClass =
  "w-full h-10 bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]";
const labelClass = "text-xs font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]";

interface Props {
  name: string | null;
  birthDate: string | null;
}

export function EditProfileForm({ name, birthDate }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [birthDateValue, setBirthDateValue] = useState(birthDate ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error ?? "Error al guardar.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="profile-name" className={labelClass}>Nombre</label>
        <input
          id="profile-name"
          name="name"
          type="text"
          required
          defaultValue={name ?? ""}
          placeholder="Tu nombre completo"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Fecha de nacimiento</label>
        <DateInput name="birthDate" value={birthDateValue} onChange={setBirthDateValue} />
      </div>

      {error && (
        <p className="text-xs text-[#E61919] border-l-2 border-[#E61919] bg-[#0A1F2A] px-3 py-2 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-[#27C7B8] border-l-2 border-[#27C7B8] bg-[#0A1F2A] px-3 py-2 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          Perfil actualizado.
        </p>
      )}

      <Button type="submit" variant="brand" size="sm" fullWidth loading={isPending}>
        Guardar cambios
      </Button>
    </form>
  );
}
