import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingCardItem } from "@/components/booking/BookingCardItem";
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
          name: true,
          startTime: true,
          endTime: true,
          dayOfWeek: true,
          coach: { select: { name: true } },
        },
      },
    },
  });

  return (
    <section className="px-4 pt-5">
      <div className="mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Próximos</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Mis turnos</h2>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-400">Sin turnos próximos</p>
          <p className="text-xs text-zinc-600 mt-1">Reservá una clase desde la pantalla de inicio</p>
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
                  name: b.class.name,
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
