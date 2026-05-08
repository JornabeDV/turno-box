import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingCardItem } from "@/components/booking/BookingCardItem";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mis turnos" };

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const bookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
      status: { in: ["CONFIRMED", "WAITLISTED"] },
      classDate: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) },
    },
    orderBy: [{ classDate: "asc" }, { class: { startTime: "asc" } }],
    select: {
      id: true,
      status: true,
      classDate: true,
      waitlistPos: true,
      class: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          dayOfWeek: true,
          coach: { select: { name: true } },
          discipline: { select: { name: true } },
        },
      },
    },
  });

  return (
    <section className="pt-4">
      <div className="mb-5">
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl">
          Mis turnos
        </h2>
        <p className="text-xs text-[#6B8A99] mt-1 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
          Próximas reservas
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-[#1A4A63] bg-[#0E2A38]">
          <CalendarBlank size={28} className="text-[#1A4A63] mb-3" />
          <p className="text-sm font-[family-name:var(--font-oswald)] font-bold text-[#6B8A99] uppercase tracking-wide">
            Sin turnos próximos
          </p>
          <p className="text-xs text-[#4A6B7A] mt-1 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
            Reservá una clase desde la pantalla de inicio
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b: typeof bookings[number], i: number) => (
            <BookingCardItem
              key={b.id}
              booking={{
                id: b.id,
                status: b.status,
                classDate: b.classDate,
                waitlistPos: b.waitlistPos,
                class: {
                  id: b.class.id,
                  name: b.class.discipline?.name ?? "Sin disciplina",
                  startTime: b.class.startTime,
                  endTime: b.class.endTime,
                  dayOfWeek: b.class.dayOfWeek,
                  coachName: b.class.coach?.name ?? null,
                },
              }}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  );
}
