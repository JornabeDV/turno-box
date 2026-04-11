"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { changePasswordAction } from "@/actions/profile";

const inputClass =
  "w-full h-10 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors";
const labelClass = "text-xs font-medium text-zinc-400 uppercase tracking-wider";

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (result.success) {
        setSuccess(true);
        formRef.current?.reset();
      } else {
        setError(result.error ?? "Error al cambiar contraseña.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="pw-current" className={labelClass}>Contraseña actual</label>
        <input
          id="pw-current"
          name="current"
          type="password"
          required
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pw-next" className={labelClass}>Nueva contraseña</label>
        <input
          id="pw-next"
          name="next"
          type="password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pw-confirm" className={labelClass}>Confirmar contraseña</label>
        <input
          id="pw-confirm"
          name="confirm"
          type="password"
          required
          placeholder="Repetí la nueva contraseña"
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
          Contraseña actualizada.
        </p>
      )}

      <Button type="submit" variant="brand" size="sm" fullWidth loading={isPending}>
        Cambiar contraseña
      </Button>
    </form>
  );
}
