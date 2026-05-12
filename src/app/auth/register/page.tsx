import { RegisterForm } from "@/components/auth/RegisterForm";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center py-16 px-4 bg-[#0A1F2A] relative">

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="w-full mb-8">
          <Logo />
        </div>

        {/* Título */}
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl mb-6 text-center">
          Crear cuenta
        </h2>

        {/* Card */}
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-6">
          <RegisterForm />
        </div>

        <p className="text-center text-xs text-[#6B8A99] mt-6 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          ¿Ya tenés cuenta?{" "}
          <a href="/auth/login" className="text-[#27C7B8] hover:text-[#20A898] transition-colors">
            Iniciá sesión
          </a>
        </p>
      </div>
    </div>
  );
}
