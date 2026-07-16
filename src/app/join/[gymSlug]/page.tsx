import { prisma } from "@/lib/prisma";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import { ArrowLeftIcon, Barbell } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Unite al gimnasio" };

export default async function JoinPage({
  params,
}: {
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = await params;

  const gym = await prisma.gym.findUnique({
    where: { slug: gymSlug },
    select: { id: true, name: true, logoUrl: true, slug: true },
  });

  if (!gym) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <span className="text-4xl text-danger mb-4">✕</span>
        <h1 className="text-lg font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight mb-2">
          Gimnasio no encontrado
        </h1>
        <p className="text-sm text-secondary max-w-xs font-[family-name:var(--font-oswald)]">
          El link de invitación no es válido o el gimnasio ya no está activo.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide"
        >
          <ArrowLeftIcon size={13} />
          Ir al login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-page relative">
      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="w-full mb-3 md:mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-xl border border-border bg-card overflow-hidden flex items-center justify-center p-2">
            {gym.logoUrl ? (
              <img src={gym.logoUrl} alt={gym.name} className="w-full h-full object-contain" />
            ) : (
              <Barbell size={40} className="text-brand" />
            )}
          </div>
        </div>

        {/* Título */}
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl mb-6 text-center">
          Unite a {gym.name}
        </h2>

        {/* Card */}
        <div className="bg-card border border-border p-6">
          <RegisterForm defaultGymId={gym.id} gymSlug={gym.slug} />
        </div>

        <p className="text-center text-xs sm:text-sm text-secondary mt-6 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          ¿Ya tenés cuenta?{" "}
          <Link href={`/auth/login?gymSlug=${gym.slug}`} className="text-success hover:text-success-hover transition-colors">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
