// Página principal del alumno: lista de clases del día
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClassSlotsForDay } from "@/lib/queries/classes";
import { ClassList } from "@/components/booking/ClassList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clases" };

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { gymId: true, name: true },
  });

  // Si el usuario no tiene gym asignado aún (registro nuevo)
  if (!user?.gymId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="size-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5">
            <path d="M6.5 6.5h11M6.5 17.5h11M12 2v20M2 12h4M18 12h4"/>
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">
          Sin gym asignado
        </h2>
        <p className="text-sm text-zinc-500 max-w-xs">
          Tu cuenta está activa, pero aún no fuiste asignado a ningún gimnasio. Contactá al administrador.
        </p>
      </div>
    );
  }

  const today = new Date();
  const slots = await getClassSlotsForDay(user.gymId, today, session.user.id);

  return (
    <section>
      {/* Saludo */}
      <div className="px-4 pt-5 pb-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">
          Bienvenido
        </p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
          {user.name?.split(" ")[0] ?? "Atleta"}
        </h2>
      </div>

      <ClassList
        initialSlots={slots}
        initialDate={today}
        gymId={user.gymId}
        userId={session.user.id}
      />
    </section>
  );
}
