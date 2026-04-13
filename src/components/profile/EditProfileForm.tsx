"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateProfileAction } from "@/actions/profile";

const inputClass =
  "w-full h-10 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors";
const labelClass = "text-xs font-medium text-zinc-400 uppercase tracking-wider";

interface Props {
  name: string | null;
  birthDate: Date | null;
}

export function EditProfileForm({ name, birthDate }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const birthValue = birthDate
    ? birthDate.toISOString().split("T")[0]
    : "";

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
        <label htmlFor="profile-birth" className={labelClass}>Fecha de nacimiento</label>
        <input
          id="profile-birth"
          name="birthDate"
          type="date"
          defaultValue={birthValue}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
          Perfil actualizado.
        </p>
      )}

      <Button type="submit" variant="brand" size="sm" fullWidth loading={isPending}>
        Guardar cambios
      </Button>
    </form>
  );
}
