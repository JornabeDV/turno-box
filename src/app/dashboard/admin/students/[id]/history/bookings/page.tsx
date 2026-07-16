import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/ui/BackButton";
import { BookingHistoryList } from "@/components/admin/BookingHistoryList";
import type { Metadata } from "next";

const MAX_ITEMS = 100;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const student = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  return { title: `Turnos · ${student?.name ?? student?.email ?? "Alumno"}` };
}

export default async function StudentBookingsHistoryPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const student = await prisma.user.findFirst({
    where: { id, gymId: user.gymId, role: "STUDENT" },
    select: { id: true, name: true, email: true },
  });
  if (!student) notFound();

  const bookings = await prisma.booking.findMany({
    where: { userId: id, deletedAt: null },
    orderBy: { classDate: "desc" },
    take: MAX_ITEMS,
    select: {
      id: true,
      status: true,
      classDate: true,
      waitlistPos: true,
      cancelledAt: true,
      class: {
        select: {
          startTime: true,
          endTime: true,
          color: true,
          discipline: { select: { name: true } },
        },
      },
    },
  });

  // Serializar fechas para el componente cliente
  const serializedBookings = bookings.map((b) => ({
    ...b,
    classDate: b.classDate.toISOString(),
    cancelledAt: b.cancelledAt?.toISOString() ?? null,
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <BackButton href={`/dashboard/admin/students/${id}`} />

      <div className="bg-card border border-border p-5">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-primary tracking-tight">
          Historial de turnos
        </h2>
        <p className="text-sm md:text-base text-secondary mt-1">
          {student.name ?? student.email}
        </p>
      </div>

      <div className="bg-card border border-border overflow-hidden">
        <BookingHistoryList bookings={serializedBookings} />
      </div>
    </div>
  );
}
