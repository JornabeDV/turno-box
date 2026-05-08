"use client";

import { useRef, useState, useTransition } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { changePasswordAction } from "@/actions/profile";

const inputClass =
  "w-full h-10 bg-[#0A1F2A] border border-[#1A4A63] px-3.5 pr-10 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]";
const labelClass = "text-xs font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]";

function PasswordField({
  id,
  name,
  label,
  placeholder,
  minLength,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={minLength}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A6B7A] hover:text-[#6B8A99] transition-colors"
        >
          {show ? <EyeSlash size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
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
      <PasswordField
        id="pw-current"
        name="current"
        label="Contraseña actual"
        placeholder="••••••••"
      />
      <PasswordField
        id="pw-next"
        name="next"
        label="Nueva contraseña"
        placeholder="Mínimo 6 caracteres"
        minLength={6}
      />
      <PasswordField
        id="pw-confirm"
        name="confirm"
        label="Confirmar contraseña"
        placeholder="Repetí la nueva contraseña"
      />

      {error && (
        <p className="text-xs text-[#E61919] border-l-2 border-[#E61919] bg-[#0A1F2A] px-3 py-2 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-[#27C7B8] border-l-2 border-[#27C7B8] bg-[#0A1F2A] px-3 py-2 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          Contraseña actualizada.
        </p>
      )}

      <Button type="submit" variant="brand" size="sm" fullWidth loading={isPending}>
        Cambiar contraseña
      </Button>
    </form>
  );
}
