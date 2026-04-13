"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DatePicker";
import { WarningCircle, CheckCircle, Eye, EyeSlash } from "@phosphor-icons/react";
import { registerAction } from "@/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [birthDate, setBirthDate] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    
    if (password !== confirmPassword) {
      setPending(false);
      setError("Las contraseñas no coinciden");
      return;
    }

    let result;
    try {
      result = await registerAction(formData);
    } catch {
      setPending(false);
      setError("Ocurrió un error inesperado. Intentá de nuevo.");
      return;
    }

    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/auth/login"), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Nombre completo
        </label>
        <input
          id="name" name="name" type="text" required
          placeholder="Juan García"
          className="h-11 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Email
        </label>
        <input
          id="email" name="email" type="email" required
          placeholder="tu@email.com"
          className="h-11 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password" name="password" type={showPassword ? "text" : "password"} required minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="w-full h-11 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Repetir contraseña
        </label>
        <div className="relative">
          <input
            id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required minLength={6}
            placeholder="Repetí tu contraseña"
            className="w-full h-11 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Fecha de nacimiento
        </label>
        <DateInput name="birthDate" value={birthDate} onChange={setBirthDate} minAge={10} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2.5">
          <WarningCircle size={15} className="text-rose-400 shrink-0" />
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
          <CheckCircle size={15} className="text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-400">Cuenta creada. Redirigiendo...</p>
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={pending} className="mt-1">
        Crear cuenta
      </Button>
    </form>
  );
}
