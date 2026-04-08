import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/utils";
import { deleteClassAction } from "@/actions/classes";
import { PlusIcon, CopySimpleIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Clases" };

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lunes", TUESDAY: "Martes", WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves", FRIDAY: "Viernes", SATURDAY: "Sábado", SUNDAY: "Domingo",
};
const DAY_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

export default async function ClassesPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const classes = await prisma.gymClass.findMany({
    where: { gymId: user.gymId, isActive: true, deletedAt: null },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    select: {
      id: true, name: true, dayOfWeek: true,
      startTime: true, endTime: true, maxCapacity: true, color: true,
      coach: { select: { name: true } },
    },
  });

  const grouped = DAY_ORDER.reduce<Record<string, typeof classes>>((acc, day) => {
    const dayClasses = classes.filter((c) => c.dayOfWeek === day);
    if (dayClasses.length > 0) acc[day] = dayClasses;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Admin</p>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Clases</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/admin/classes/duplicate">
            <Button size="sm" variant="ghost">
              <CopySimpleIcon size={14} />
              Duplicar
            </Button>
          </Link>
          <Link href="/dashboard/admin/classes/new">
            <Button size="sm" variant="brand">
              <PlusIcon size={14} weight="bold" />
              Nueva clase
            </Button>
          </Link>
        </div>
      </div>

      {Object.entries(grouped).map(([day, dayClasses]) => (
        <div key={day}>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">
            {DAY_LABELS[day]}
          </h3>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            {dayClasses.map((c: typeof classes[number]) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3.5">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.color ?? "#f97316" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100">{c.name}</p>
                  <p className="text-xs text-zinc-500 font-mono tabular-nums">
                    {formatTime(c.startTime)} – {formatTime(c.endTime)} · {c.maxCapacity} cupos
                    {c.coach?.name && ` · ${c.coach.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/admin/classes/${c.id}/edit`}>
                    <Button variant="ghost" size="sm">Editar</Button>
                  </Link>
                  <form action={deleteClassAction.bind(null, c.id)}>
                    <Button variant="danger" size="sm" type="submit">Eliminar</Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {classes.length === 0 && (
        <div className="glass-card rounded-2xl px-4 py-16 text-center">
          <p className="text-sm text-zinc-500 mb-4">No hay clases creadas todavía.</p>
          <Link href="/dashboard/admin/classes/new">
            <Button variant="brand" size="md">Crear primera clase</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
