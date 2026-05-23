// Página completa de clases disponibles
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClassSlotsForDay, getGymClassDays } from "@/lib/queries/classes";
import { ClassList } from "@/components/booking/ClassList";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clases disponibles" };
export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { gymId: true },
  });

  if (!user?.gymId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center border border-[#1A4A63] bg-[#0E2A38]">
        <span className="text-3xl text-[#F78837] mb-4">✕</span>
        <h2 className="text-lg font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight mb-2">
          Sin gym asignado
        </h2>
        <p className="text-sm text-[#6B8A99] max-w-xs font-[family-name:var(--font-oswald)]">
          Tu cuenta está activa, pero aún no fuiste asignado a ningún gimnasio.
          Contactá al administrador.
        </p>
      </div>
    );
  }

  const today = new Date();
  const [slots, availableDays] = await Promise.all([
    getClassSlotsForDay(user.gymId, today, session.user.id),
    getGymClassDays(user.gymId),
  ]);

  return (
    <section className="space-y-5">
      <div className="pt-4 pb-2 flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide"
        >
          <ArrowLeftIcon size={13} />
          Inicio
        </Link>
      </div>

      <h1 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl leading-none">
        Clases disponibles
      </h1>

      <ClassList
        initialSlots={slots}
        initialDate={today}
        gymId={user.gymId}
        userId={session.user.id}
        availableDays={availableDays}
      />
    </section>
  );
}
