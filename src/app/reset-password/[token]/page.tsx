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
        <div className="flex flex-col items-center my-8">
          <span className="bg-white rounded-2xl px-4 py-3 flex items-center mb-6">
            <img src="/icons/Logo-header.png" alt="Bee Box" className="h-14 w-auto" />
          </span>
          <p className="text-sm text-zinc-500 mt-1">Nueva contraseña</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6">
          <ResetPasswordForm token={token} />
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          <Link href="/auth/login" className="text-orange-500 hover:text-orange-400 transition-colors">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}