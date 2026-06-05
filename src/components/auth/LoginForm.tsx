"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  WarningCircle,
} from "@phosphor-icons/react";

interface GymInfo {
  id: string;
  name: string;
  logoUrl: string | null;
  slug: string;
}

function LoginFormInner({ preselectedGym }: { preselectedGym: GymInfo | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;

    let destination = callbackUrl;
    if (role === "SUPER_ADMIN") destination = "/dashboard/super-admin";
    else if (role === "ADMIN") destination = "/dashboard/admin";
    else if (role === "COACH") destination = "/dashboard/coach";

    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Email */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-xs sm:text-sm font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]"
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@alumno.com"
            className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] px-10 text-sm sm:text-base text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-xs sm:text-sm font-medium text-[#6B8A99] uppercase tracking-wider font-[family-name:var(--font-oswald)]"
          >
            Contraseña
          </label>
          <Link
            href={preselectedGym ? `/forgot-password?gymSlug=${preselectedGym.slug}` : "/forgot-password"}
            className="text-[11px] sm:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wide text-[#27C7B8] hover:text-[#20A898] transition-colors"
          >
            Olvidaste tu contraseña?
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] px-10 pr-10 text-sm sm:text-base text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
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

      {error && (
        <div className="flex items-center gap-2 border-l-2 border-[#E61919] bg-[#0E2A38] px-3 py-2.5">
          <WarningCircle size={15} className="text-[#E61919] shrink-0" />
          <p className="text-xs sm:text-sm text-[#E61919] font-[family-name:var(--font-oswald)] uppercase tracking-wide">
            {error}
          </p>
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={pending} className="mt-1">
        Ingresar
      </Button>

    </form>
  );
}

export function LoginForm({ preselectedGym }: { preselectedGym?: GymInfo | null }) {
  return (
    <Suspense>
      <LoginFormInner preselectedGym={preselectedGym ?? null} />
    </Suspense>
  );
}
