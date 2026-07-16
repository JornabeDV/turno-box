import { RegisterForm } from "@/components/auth/RegisterForm";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-page relative">

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="w-full mb-3 md:mb-8">
          <Logo />
        </div>

        {/* Título */}
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl mb-6 text-center">
          Crear cuenta
        </h2>

        {/* Card */}
        <div className="bg-card border border-border p-6">
          <RegisterForm />
        </div>

        <p className="text-center text-xs sm:text-sm text-secondary mt-6 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          ¿Ya tenés cuenta?{" "}
          <a href="/auth/login" className="text-success hover:text-success-hover transition-colors">
            Iniciá sesión
          </a>
        </p>
      </div>
    </div>
  );
}
