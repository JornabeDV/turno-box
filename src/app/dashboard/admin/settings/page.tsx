import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuración" };

export default async function AdminSettingsPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const gym = await prisma.gym.findUnique({
    where: { id: user.gymId },
    select: {
      name:              true,
      logoUrl:           true,
      address:           true,
      phone:             true,
      cancelWindowHours: true,
      waitlistEnabled:   true,
    },
  });
  if (!gym) redirect("/");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Admin</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Configuración</h2>
      </div>
      <SettingsClient gym={gym} />
    </div>
  );
}
