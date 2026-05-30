import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DisciplinesPageClient } from "./DisciplinesPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Disciplinas" };

export default async function DisciplinesPage() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const disciplines = await prisma.discipline.findMany({
    where: { gymId: user.gymId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, description: true },
  });

  return <DisciplinesPageClient disciplines={disciplines} />;
}
