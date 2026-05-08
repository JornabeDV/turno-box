// Página principal del alumno: lista de clases del día
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClassSlotsForDay } from "@/lib/queries/classes";
import { ClassList } from "@/components/booking/ClassList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clases" };
export const dynamic = "force-dynamic";

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
  const [slots, activeSubscriptions, announcements] = await Promise.all([
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
    prisma.announcement.findMany({
      where: {
        gymId: user.gymId,
        publishAt: { lte: today },
        OR: [{ expiresAt: null }, { expiresAt: { gt: today } }],
      },
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        body: true,
        pinned: true,
        publishAt: true,
      },
    }),
  ]);

  const firstName = user.name?.split(" ")[0] ?? "Atleta";

  // Buscar próxima clase reservada
  const nextBooked = slots.find((s) => s.userBooking?.status === "CONFIRMED");

  // Subscription info
  const subs = activeSubscriptions
    .map((sub) => ({
      expiresAt: sub.expiresAt!,
      remaining: sub.creditsGranted + sub.creditTxs.reduce((s, t) => s + t.amount, 0),
    }))
    .filter((sub) => sub.remaining > 0);

  const sub = subs[0];
  const daysLeft = sub
    ? Math.ceil((sub.expiresAt.getTime() - today.getTime()) / 86_400_000)
    : null;

  return (
    <section className="space-y-5">
      {/* Saludo */}
      <div className="pt-4 pb-2">
        <h1 className="font-[family-name:var(--font-oswald)] font-bold text-[#F78837] uppercase tracking-tight text-3xl leading-none">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-[#6B8A99] mt-1 font-[family-name:var(--font-oswald)]">
          Listo para superar tus marcas hoy.
        </p>

        {sub && (
          <div className="mt-2 inline-flex items-center gap-2 border border-[#1A4A63] px-2.5 py-1">
            <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#6B8A99]">
              {sub.remaining} {sub.remaining === 1 ? "CLS" : "CLS"} restantes
            </span>
            {daysLeft !== null && daysLeft <= 7 && (
              <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#F78837]">
                · {daysLeft}d
              </span>
            )}
          </div>
        )}
      </div>

      {/* Próxima clase */}
      {nextBooked && (
        <div className="bg-[#0E2A38] border border-[#1A4A63] border-l-2 border-l-[#F78837]">
          <div className="p-4">
            <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#F78837] mb-1 block">
              Próxima clase
            </span>
            <h3 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] text-xl uppercase tracking-tight">
              {nextBooked.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 mb-3">
              <span className="text-sm font-[family-name:var(--font-jetbrains)] text-[#EAEAEA] uppercase">
                {nextBooked.startTime} hrs
              </span>
            </div>
            <a
              href={`/classes/${nextBooked.id}?date=${today.toISOString().split("T")[0]}`}
              className="inline-flex items-center px-4 py-2 bg-[#F78837] text-[#0A1F2A] text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide active:scale-[0.98] transition-transform"
            >
              Ver detalles
            </a>
          </div>
        </div>
      )}

      {/* Noticias */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`border p-3 ${
                a.pinned
                  ? "border-[#F78837]/30 bg-[#F78837]/5"
                  : "border-[#1A4A63] bg-[#0E2A38]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {a.pinned && (
                  <span className="text-[9px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#F78837] border border-[#F78837]/30 px-1">
                    Fijado
                  </span>
                )}
                <p className={`text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide ${a.pinned ? "text-[#F78837]" : "text-[#27C7B8]"}`}>
                  {a.title}
                </p>
              </div>
              <p className="text-xs text-[#6B8A99] leading-relaxed font-[family-name:var(--font-oswald)]">
                {a.body}
              </p>
            </div>
          ))}
        </div>
      )}

      <ClassList
        initialSlots={slots}
        initialDate={today}
        gymId={user.gymId}
        userId={session.user.id}
      />
    </section>
  );
}
