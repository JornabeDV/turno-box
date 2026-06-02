import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/icons/Logo";
import { prisma } from "@/lib/prisma";
import { Barbell } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ gymSlug?: string }>;
}) {
  const { gymSlug } = await searchParams;

  let gym: { id: string; name: string; logoUrl: string | null; slug: string } | null = null;
  if (gymSlug) {
    gym = await prisma.gym.findUnique({
      where: { slug: gymSlug },
      select: { id: true, name: true, logoUrl: true, slug: true },
    });
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-[#0A1F2A] relative">
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
            <div className="w-24 h-24 rounded-xl border border-[#1A4A63] bg-[#0E2A38] overflow-hidden flex items-center justify-center p-2 mb-3">
              {gym.logoUrl ? (
                <img
                  src={gym.logoUrl}
                  alt={gym.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Barbell size={40} className="text-[#F78837]" />
              )}
            </div>
            <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl text-center">
              {gym.name}
            </h2>
            <p className="text-xs text-[#6B8A99] font-[family-name:var(--font-oswald)] uppercase tracking-wide mt-0.5">
              Ingresá a tu cuenta
            </p>
          </div>
        )}

        {/* Título genérico — solo si no hay gym */}
        {!gym && (
          <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl mb-6 text-center">
            Ingresá como admin
          </h2>
        )}

        {/* Card */}
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-6">
          <LoginForm preselectedGym={gym} />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#6B8A99] mt-6 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          {gym ? (
            <>
              ¿No tenés cuenta?{" "}
              <Link
                href={`/join/${gym.slug}`}
                className="text-[#27C7B8] hover:text-[#20A898] transition-colors"
              >
                Unite a {gym.name}
              </Link>
            </>
          ) : (
            <>
              ¿Sos alumno?{" "}
              <Link
                href="/gyms"
                className="text-[#27C7B8] hover:text-[#20A898] transition-colors"
              >
                Seleccioná tu box para ingresar
              </Link>
            </>
          )}
        </p>

        {/* Legal footer */}
        <div className="mt-10 text-center space-y-1">
          <p className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#4A6B7A]">
            © 2026 Box Turno. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
