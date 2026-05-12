import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resetear contraseña" };

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 bg-[#0A1F2A] relative">
      <div className="absolute top-4 right-4 text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#4A6B7A]">
        BEE_BOX v1.0
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="font-[family-name:var(--font-oswald)] font-bold text-[#F78837] uppercase tracking-tight text-3xl">
            Turno box
          </h1>
          <div className="w-12 h-0.5 bg-[#F78837] mt-1" />
        </div>

        {/* Título */}
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl mb-6 text-center">
          Nueva contraseña
        </h2>

        {/* Card */}
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-6">
          <ResetPasswordForm token={token} />
        </div>

        <p className="text-center text-xs text-[#6B8A99] mt-6 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          <Link href="/auth/login" className="text-[#27C7B8] hover:text-[#20A898] transition-colors">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
