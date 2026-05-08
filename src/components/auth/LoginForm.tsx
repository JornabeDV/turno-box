"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Envelope, Lock, Eye, EyeSlash, WarningCircle } from "@phosphor-icons/react";

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const data = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Email */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-xs font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]"
        >
          Email
        </label>
        <div className="relative">
          <Envelope
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6B7A]"
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="email@atleta.com"
            className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] px-10 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-xs font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-[11px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wide text-[#27C7B8] hover:text-[#20A898] transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6B7A]"
          />
          <input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] px-10 pr-10 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A6B7A] hover:text-[#6B8A99] transition-colors"
          >
            {showPwd ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 border-l-2 border-[#E61919] bg-[#0E2A38] px-3 py-2.5">
          <WarningCircle size={15} className="text-[#E61919] shrink-0" />
          <p className="text-xs text-[#E61919] font-[family-name:var(--font-oswald)] uppercase tracking-wide">
            {error}
          </p>
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={pending} className="mt-1">
        Ingresar
      </Button>

      {/* Separador OAuth */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-[#1A4A63]" />
        <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#6B8A99]">
          O continuar con
        </span>
        <div className="flex-1 h-px bg-[#1A4A63]" />
      </div>

      {/* OAuth buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex items-center justify-center gap-2 h-11 border border-[#1A4A63] bg-[#0E2A38] text-[#EAEAEA] hover:border-[#F78837] transition-colors text-xs font-[family-name:var(--font-oswald)] uppercase tracking-wide"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 h-11 border border-[#1A4A63] bg-[#0E2A38] text-[#EAEAEA] hover:border-[#F78837] transition-colors text-xs font-[family-name:var(--font-oswald)] uppercase tracking-wide"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Apple
        </button>
      </div>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  );
}
