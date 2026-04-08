import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClassForm } from "@/components/admin/ClassForm";
import { createClassAction } from "@/actions/classes";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nueva clase" };

export default async function NewClassPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const coaches = await prisma.user.findMany({
    where: { gymId: user.gymId, role: { in: ["COACH", "ADMIN"] }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Nueva</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Crear clase</h2>
      </div>
      <ClassForm coaches={coaches} action={createClassAction} />
    </div>
  );
}
