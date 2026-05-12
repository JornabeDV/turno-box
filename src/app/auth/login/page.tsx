import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-[#0A1F2A] relative">

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="w-full mb-8">
          <Logo />
        </div>

        {/* Título */}
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl mb-3 md:mb-6 text-center">
          Ingresá a tu cuenta
        </h2>

        {/* Card */}
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-6">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#6B8A99] mt-6 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          ¿No tenés cuenta?{" "}
          <a
            href="/auth/register"
            className="text-[#27C7B8] hover:text-[#20A898] transition-colors"
          >
            Registrate acá
          </a>
        </p>

        {/* Legal footer */}
        <div className="mt-10 text-center space-y-1">
          <p className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#4A6B7A]">
            © 2026 Turno Box. Todos los derechos reservados.
          </p>
          {/* <div className="flex items-center justify-center gap-4">
            <a href="#" className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#4A6B7A] hover:text-[#6B8A99] transition-colors">
              Privacy
            </a>
            <a href="#" className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#4A6B7A] hover:text-[#6B8A99] transition-colors">
              Terms
            </a>
          </div> */}
        </div>
      </div>
    </div>
  );
}
