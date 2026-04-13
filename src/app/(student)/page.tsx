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
  const [slots, activeSubscriptions] = await Promise.all([
    getClassSlotsForDay(user.gymId, today, session.user.id),
    prisma.payment.findMany({
      where: {
        userId: session.user.id,
        gymId: user.gymId,
        status: "APPROVED",
        expiresAt: { gt: today },
      },
      select: {
        expiresAt: true,
        creditsGranted: true,
        creditTxs: { select: { amount: true } },
      },
      orderBy: { expiresAt: "asc" },
    }),
  ]);
  return (
    <section>
      {/* Saludo */}
      <div className="pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">
            Bienvenido
          </p>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
            {user.name?.split(" ")[0] ?? "Atleta"}
          </h2>
          {(() => {
            const subs = activeSubscriptions
              .map((sub) => ({
                expiresAt: sub.expiresAt!,
                remaining: sub.creditsGranted + sub.creditTxs.reduce((s, t) => s + t.amount, 0),
              }))
              .filter((sub) => sub.remaining > 0);
            if (subs.length === 0) return null;
            const sub = subs[0];
            const daysLeft = Math.ceil(
              (sub.expiresAt.getTime() - today.getTime()) / 86_400_000
            );
            const isCritical = daysLeft <= 3;
            const isUrgent   = daysLeft <= 7;
            const dateStr    = sub.expiresAt.toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
            });
            return (
              <span
                className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-2 ${
                  isCritical
                    ? "bg-red-500/15 text-red-400"
                    : isUrgent
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {sub.remaining} {sub.remaining === 1 ? "clase vence" : "clases vencen"} {dateStr}
                {isUrgent && ` · ${daysLeft}d`}
              </span>
            );
          })()}
        </div>
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
