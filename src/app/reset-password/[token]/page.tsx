import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Logo } from "@/components/icons/Logo";
import { prisma } from "@/lib/prisma";
import { Barbell } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resetear contraseña" };

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ gymSlug?: string }>;
}

export default async function ResetPasswordPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { gymSlug } = await searchParams;

  let gym: { id: string; name: string; logoUrl: string | null; slug: string } | null = null;
  if (gymSlug) {
    gym = await prisma.gym.findUnique({
      where: { slug: gymSlug },
      select: { id: true, name: true, logoUrl: true, slug: true },
    });
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-page relative">
      <div className="w-full max-w-sm relative">
        {/* Logo BoxTurno — solo si no hay gym seleccionado */}
        {!gym && (
          <div className="w-full mb-3 md:mb-8">
            <Logo />
          </div>
        )}

        {/* Logo del gym — cuando viene por gymSlug */}
        {gym && (
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-xl border border-border bg-card overflow-hidden flex items-center justify-center p-2 mb-3">
              {gym.logoUrl ? (
                <img
                  src={gym.logoUrl}
                  alt={gym.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Barbell size={40} className="text-brand" />
              )}
            </div>
            <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl text-center">
              {gym.name}
            </h2>
            <p className="text-xs sm:text-sm text-secondary font-[family-name:var(--font-oswald)] uppercase tracking-wide mt-0.5">
              Nueva contraseña
            </p>
          </div>
        )}

        {/* Título genérico — solo si no hay gym */}
        {!gym && (
          <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl mb-6 text-center">
            Nueva contraseña
          </h2>
        )}

        {/* Card */}
        <div className="bg-card border border-border p-6">
          <ResetPasswordForm token={token} gymSlug={gym?.slug} />
        </div>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-secondary mt-6 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          <Link
            href={gym ? `/auth/login?gymSlug=${gym.slug}` : "/auth/login"}
            className="text-success hover:text-success-hover transition-colors"
          >
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
