"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DatePicker";
import { WarningCircle, CheckCircle, Eye, EyeSlash, User, Envelope, Lock } from "@phosphor-icons/react";
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-xs font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]">
          Nombre completo
        </label>
        <div className="relative">
          <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6B7A]" />
          <input
            id="name" name="name" type="text" required
            placeholder="Juan García"
            className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] px-10 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
          />
        </div>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-xs font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]">
          Email
        </label>
        <div className="relative">
          <Envelope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6B7A]" />
          <input
            id="email" name="email" type="email" required
            placeholder="email@atleta.com"
            className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] px-10 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-xs font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]">
          Contraseña
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6B7A]" />
          <input
            id="password" name="password" type={showPassword ? "text" : "password"} required minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] px-10 pr-10 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A6B7A] hover:text-[#6B8A99] transition-colors"
          >
            {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="text-xs font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]">
          Repetir contraseña
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6B7A]" />
          <input
            id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required minLength={6}
            placeholder="Repetí tu contraseña"
            className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] px-10 pr-10 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A6B7A] hover:text-[#6B8A99] transition-colors"
          >
            {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Birth date */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]">
          Fecha de nacimiento
        </label>
        <DateInput name="birthDate" value={birthDate} onChange={setBirthDate} minAge={10} />
      </div>

      {error && (
        <div className="flex items-center gap-2 border-l-2 border-[#E61919] bg-[#0E2A38] px-3 py-2.5">
          <WarningCircle size={15} className="text-[#E61919] shrink-0" />
          <p className="text-xs text-[#E61919] font-[family-name:var(--font-oswald)] uppercase tracking-wide">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 border-l-2 border-[#27C7B8] bg-[#0E2A38] px-3 py-2.5">
          <CheckCircle size={15} className="text-[#27C7B8] shrink-0" />
          <p className="text-xs text-[#27C7B8] font-[family-name:var(--font-oswald)] uppercase tracking-wide">Cuenta creada. Redirigiendo...</p>
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={pending} className="mt-1">
        Crear cuenta
      </Button>
    </form>
  );
}
