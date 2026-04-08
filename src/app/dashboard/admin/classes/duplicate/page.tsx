import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DuplicateDayForm } from "@/components/admin/DuplicateDayForm";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Duplicar horarios" };

const DAY_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"] as const;

export default async function DuplicateClassesPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const classes = await prisma.gymClass.findMany({
    where: { gymId: user.gymId, isActive: true, deletedAt: null },
    select: { name: true, startTime: true, endTime: true, color: true, dayOfWeek: true },
    orderBy: { startTime: "asc" },
  });

  const classesByDay = DAY_ORDER.reduce<
    Record<string, { name: string; startTime: string; endTime: string; color: string | null }[]>
  >((acc, day) => {
    acc[day] = classes
      .filter((c) => c.dayOfWeek === day)
      .map(({ name, startTime, endTime, color }) => ({ name, startTime, endTime, color }));
    return acc;
  }, {});

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/dashboard/admin/classes"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeftIcon size={13} />
          Clases
        </Link>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Admin</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Duplicar horarios</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Copiá las clases de un día a otros días de la semana. Los duplicados exactos se omiten automáticamente.
        </p>
      </div>

      <DuplicateDayForm classesByDay={classesByDay} />
    </div>
  );
}
