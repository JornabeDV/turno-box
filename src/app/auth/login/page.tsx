import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 bg-[#0f0f0f]">
      {/* Glow ambiental de fondo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-96 rounded-full bg-orange-500/10 blur-[80px]" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <span className="size-12 rounded-2xl bg-orange-500 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(249,115,22,.3)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5h11M6.5 17.5h11M12 2v20M2 12h4M18 12h4"/>
            </svg>
          </span>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            CrossFit Turnos
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Ingresá a tu cuenta</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          ¿No tenés cuenta?{" "}
          <a href="/auth/register" className="text-orange-500 hover:text-orange-400 transition-colors">
            Registrate
          </a>
        </p>
      </div>
    </div>
  );
}
