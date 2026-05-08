"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { WarningCircle, CheckCircle } from "@phosphor-icons/react";

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
        <CheckCircle size={48} className="text-green-500 mx-auto" />
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">Email enviado</h3>
          <p className="text-sm text-zinc-400">
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Olvidé mi contraseña</h3>
        <p className="text-sm text-zinc-400">
          Ingresa tu email y te enviaremos un enlace para resetear tu contraseña.
        </p>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@email.com"
          className="h-11 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2.5">
          <WarningCircle size={15} className="text-rose-400 shrink-0" />
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={pending} className="mt-1">
        Enviar email de recuperación
      </Button>
    </form>
  );
}