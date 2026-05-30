"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { WarningCircle, CheckCircle, Envelope } from "@phosphor-icons/react";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setPending(true);

    const data = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al enviar el email");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <CheckCircle size={48} className="text-[#27C7B8] mx-auto" />
        <div>
          <h3 className="text-lg font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight mb-2">
            Email enviado
          </h3>
          <p className="text-sm text-[#6B8A99] font-[family-name:var(--font-oswald)]">
            Si existe una cuenta con ese email, recibirás instrucciones para resetear tu contraseña.
          </p>
        </div>
        <Button
          onClick={() => router.push("/auth/login")}
          fullWidth
          size="lg"
          className="mt-4"
        >
          Volver al login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight mb-2">
          Olvidé mi contraseña
        </h3>
        <p className="text-sm text-[#6B8A99] font-[family-name:var(--font-oswald)]">
          Ingresá tu email y te enviaremos un enlace para resetear tu contraseña.
        </p>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-xs font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]">
          Email
        </label>
        <div className="relative">
          <Envelope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6B7A]" />
          <input
            id="email" name="email" type="email" autoComplete="email" required
            placeholder="email@atleta.com"
            className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] px-10 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 border-l-2 border-[#E61919] bg-[#0E2A38] px-3 py-2.5">
          <WarningCircle size={15} className="text-[#E61919] shrink-0" />
          <p className="text-xs text-[#E61919] font-[family-name:var(--font-oswald)] uppercase tracking-wide">{error}</p>
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={pending} className="mt-1">
        Enviar email de recuperación
      </Button>
    </form>
  );
}
