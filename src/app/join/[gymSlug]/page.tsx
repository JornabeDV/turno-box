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
    select: { id: true, name: true, logoUrl: true },
  });

  if (!gym) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <span className="text-4xl text-[#E61919] mb-4">✕</span>
        <h1 className="text-lg font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight mb-2">
          Gimnasio no encontrado
        </h1>
        <p className="text-sm text-[#6B8A99] max-w-xs font-[family-name:var(--font-oswald)]">
          El link de invitación no es válido o el gimnasio ya no está activo.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide"
        >
          <ArrowLeftIcon size={13} />
          Ir al login
        </Link>
      </div>
    );
  }

  return (
    <section className="max-w-sm mx-auto pt-8 pb-12 px-4">
      {/* Header */}
      <div className="text-center mb-3 md:mb-8">
        <div className="inline-flex items-center justify-center size-14 border border-[#F78837]/30 bg-[#F78837]/10 mb-4">
          {gym.logoUrl ? (
            <img src={gym.logoUrl} alt={gym.name} className="w-8 h-8 object-contain" />
          ) : (
            <Barbell size={28} className="text-[#F78837]" />
          )}
        </div>
        <h1 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-xl">
          Unite a {gym.name}
        </h1>
        <p className="text-xs text-[#6B8A99] mt-1 font-[family-name:var(--font-oswald)]">
          Creá tu cuenta para reservar clases
        </p>
      </div>

      {/* Form */}
      <RegisterForm defaultGymId={gym.id} />

      {/* Login link */}
      <div className="mt-6 text-center">
        <p className="text-xs text-[#6B8A99] font-[family-name:var(--font-oswald)]">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/auth/login"
            className="text-[#F78837] hover:underline"
          >
            Ingresá acá
          </Link>
        </p>
      </div>
    </section>
  );
}
