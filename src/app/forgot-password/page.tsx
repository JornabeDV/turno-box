import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Olvidé mi contraseña" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 bg-[#0A1F2A] relative">
      <div className="absolute top-4 right-4 text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#4A6B7A]">
        BEE_BOX v1.0
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="w-full mb-8">
          <Logo />
        </div>

        {/* Card */}
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-6">
          <ForgotPasswordForm />
        </div>

        <p className="text-center text-xs text-[#6B8A99] mt-6 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          ¿Recordaste tu contraseña?{" "}
          <Link href="/auth/login" className="text-[#27C7B8] hover:text-[#20A898] transition-colors">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
