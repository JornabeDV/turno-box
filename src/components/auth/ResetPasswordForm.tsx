"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Eye,
  EyeSlash,
  WarningCircle,
  CheckCircle,
  Lock,
} from "@phosphor-icons/react";

interface ResetPasswordFormProps {
  token: string;
  gymSlug?: string;
}

export function ResetPasswordForm({ token, gymSlug }: ResetPasswordFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const data = new FormData(e.currentTarget);
    const password = data.get("password") as string;
    const confirmPassword = data.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setPending(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setPending(false);
      return;
    }

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al resetear la contraseña");
      }

      setSuccess(true);
      setTimeout(() => {
        const redirectUrl = gymSlug
          ? `/auth/login?gymSlug=${gymSlug}`
          : "/auth/login";
        router.push(redirectUrl);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <CheckCircle size={48} className="text-success mx-auto" />
        <div>
          <h3 className="text-lg font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight mb-2">
            Contraseña cambiada
          </h3>
          <p className="text-sm sm:text-base text-secondary font-[family-name:var(--font-oswald)]">
            Tu contraseña ha sido actualizada exitosamente. Serás redirigido al
            login en unos segundos...
          </p>
        </div>
        <Button
          onClick={() => {
            const redirectUrl = gymSlug
              ? `/auth/login?gymSlug=${gymSlug}`
              : "/auth/login";
            router.push(redirectUrl);
          }}
          fullWidth
          size="lg"
          className="mt-4"
        >
          Ir al login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Password */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-xs sm:text-sm font-medium text-secondary uppercase tracking-wider font-[family-name:var(--font-oswald)]"
        >
          Nueva contraseña
        </label>
        <div className="relative">
          <Lock
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="••••••••"
            className="w-full h-12 bg-page border border-border px-10 pr-10 text-sm sm:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
          >
            {showPwd ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="confirmPassword"
          className="text-xs sm:text-sm font-medium text-secondary uppercase tracking-wider font-[family-name:var(--font-oswald)]"
        >
          Confirmar contraseña
        </label>
        <div className="relative">
          <Lock
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPwd ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="••••••••"
            className="w-full h-12 bg-page border border-border px-10 pr-10 text-sm sm:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
          >
            {showConfirmPwd ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 border-l-2 border-danger bg-card px-3 py-2.5">
          <WarningCircle size={15} className="text-danger shrink-0" />
          <p className="text-xs text-danger font-[family-name:var(--font-oswald)] uppercase tracking-wide">
            {error}
          </p>
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={pending}
        className="mt-1"
      >
        Cambiar contraseña
      </Button>
    </form>
  );
}
