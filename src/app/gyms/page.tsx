import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { searchGymsAction } from "@/actions/gyms";
import { GymDiscoveryClient } from "@/components/gyms/GymDiscoveryClient";

export const metadata: Metadata = {
  title: "Encontrá tu box — BoxTurno",
  description: "Buscá tu box de CrossFit y unite para reservar tus clases.",
};

export const dynamic = "force-dynamic";

export default async function GymsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const result = await searchGymsAction(q);
  const gyms = result.success ? result.data : [];

  return (
    <main className="min-h-dvh bg-[#0A1F2A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="w-full mb-3 md:mb-8">
          <Logo />
        </div>

        <h1 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl mb-2 text-center">
          Encontrá tu box
        </h1>
        <p className="text-sm text-[#6B8A99] text-center mb-8 font-[family-name:var(--font-oswald)]">
          Buscá tu gimnasio y unite para reservar clases
        </p>

        <GymDiscoveryClient initialGyms={gyms} initialQuery={q ?? ""} />

        <p className="text-center text-xs text-[#6B8A99] mt-8 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
          Seleccioná tu box para ingresar
        </p>
      </div>
    </main>
  );
}
