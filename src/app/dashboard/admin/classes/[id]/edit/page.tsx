import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClassForm } from "@/components/admin/ClassForm";
import { updateClassAction } from "@/actions/classes";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar clase" };

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const gymClass = await prisma.gymClass.findFirst({
    where: { id, gymId: user.gymId, deletedAt: null },
    select: {
      id: true, name: true, description: true, dayOfWeek: true,
      startTime: true, endTime: true, maxCapacity: true, color: true, coachId: true,
    },
  });

  if (!gymClass) notFound();

  const coaches = await prisma.user.findMany({
    where: { gymId: user.gymId, role: { in: ["COACH", "ADMIN"] }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const action = updateClassAction.bind(null, id);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Editar</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">{gymClass.name}</h2>
      </div>
      <ClassForm
        coaches={coaches}
        action={action}
        defaultValues={{
          name: gymClass.name,
          description: gymClass.description ?? undefined,
          dayOfWeek: gymClass.dayOfWeek,
          startTime: gymClass.startTime,
          endTime: gymClass.endTime,
          maxCapacity: gymClass.maxCapacity,
          color: gymClass.color ?? undefined,
          coachId: gymClass.coachId ?? undefined,
        }}
      />
    </div>
  );
}
