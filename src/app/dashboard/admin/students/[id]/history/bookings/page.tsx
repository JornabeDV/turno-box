import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

const PAGE_SIZE = 5;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const student = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  return { title: `Turnos · ${student?.name ?? student?.email ?? "Alumno"}` };
}

export default async function StudentBookingsHistoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;

  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const student = await prisma.user.findFirst({
    where: { id, gymId: user.gymId, role: "STUDENT" },
    select: { id: true, name: true, email: true },
  });
  if (!student) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: id, deletedAt: null },
      orderBy: { classDate: "desc" },
      skip,
      take: PAGE_SIZE,
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
    }),
    prisma.booking.count({ where: { userId: id, deletedAt: null } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href={`/dashboard/admin/students/${id}`}
        className="inline-flex items-center gap-1.5 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
      >
        <ArrowLeftIcon size={13} />
        Volver al alumno
      </Link>

      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5">
        <h2 className="text-lg font-bold text-[#EAEAEA] tracking-tight">
          Historial de turnos
        </h2>
        <p className="text-sm text-[#6B8A99] mt-1">
          {student.name ?? student.email}
        </p>
      </div>

      <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
        {bookings.length === 0 ? (
          <p className="text-xs text-[#4A6B7A] text-center py-12">
            Sin turnos registrados.
          </p>
        ) : (
          <div className="divide-y divide-[#1A4A63]">
            {bookings.map((b) => {
              const isPast = new Date(b.classDate) < new Date();
              return (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "size-1.5 rounded-full shrink-0",
                      b.status === "CANCELLED" && "bg-[#4A6B7A]",
                      b.status === "WAITLISTED" && "bg-[#F78837]",
                      b.status === "CONFIRMED" && isPast && "bg-emerald-600",
                      b.status === "CONFIRMED" && !isPast && "bg-[#27C7B8]",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        b.status === "CANCELLED"
                          ? "text-[#4A6B7A] line-through"
                          : "text-[#EAEAEA]",
                      )}
                    >
                      {b.class.discipline?.name ?? "Sin disciplina"}
                    </p>
                    <p className="text-xs text-[#4A6B7A]">
                      {formatDate(b.classDate)} · {formatTime(b.class.startTime)}
                      {b.status === "WAITLISTED" && b.waitlistPos !== null && (
                        <span className="ml-2 text-[#F78837]">
                          #{b.waitlistPos} en espera
                        </span>
                      )}
                      {b.status === "CANCELLED" && b.cancelledAt && (
                        <span className="ml-2 text-[#4A6B7A]">
                          cancelado{" "}
                          {new Date(b.cancelledAt).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium shrink-0",
                      b.status === "CONFIRMED" && isPast && "text-emerald-600",
                      b.status === "CONFIRMED" && !isPast && "text-[#27C7B8]",
                      b.status === "CANCELLED" && "text-[#4A6B7A]",
                      b.status === "WAITLISTED" && "text-[#F78837]",
                    )}
                  >
                    {b.status === "CONFIRMED" && isPast && "Asistió"}
                    {b.status === "CONFIRMED" && !isPast && "Confirmado"}
                    {b.status === "CANCELLED" && "Canceló"}
                    {b.status === "WAITLISTED" && "En espera"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/admin/students/${id}/history/bookings?page=${page - 1}`}
            className={cn(
              "inline-flex items-center gap-1 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors",
              !hasPrev && "pointer-events-none opacity-30",
            )}
          >
            <CaretLeftIcon size={12} />
            Anterior
          </Link>
          <span className="text-xs text-[#6B8A99] tabular-nums">
            Página {page} de {totalPages}
          </span>
          <Link
            href={`/dashboard/admin/students/${id}/history/bookings?page=${page + 1}`}
            className={cn(
              "inline-flex items-center gap-1 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors",
              !hasNext && "pointer-events-none opacity-30",
            )}
          >
            Siguiente
            <CaretRightIcon size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
