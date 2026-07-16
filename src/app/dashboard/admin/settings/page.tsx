import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuración" };

export default async function AdminSettingsPage() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const [gym, mpConfig, currentUser] = await Promise.all([
    prisma.gym.findUnique({
      where: { id: user.gymId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        address: true,
        phone: true,
        cancelWindowHours: true,
        waitlistEnabled: true,
        slug: true,
      },
    }),
    prisma.$queryRaw<[{ mpConfigured: boolean }]>`
      SELECT CASE WHEN "mpAccessToken" IS NOT NULL AND "mpAccessToken" <> '' THEN true ELSE false END as "mpConfigured"
      FROM gyms WHERE id = ${user.gymId}
    `,
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    }),
  ]);
  if (!gym) redirect("/");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs md:text-sm text-secondary uppercase tracking-wider mb-0.5">
          Admin
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary tracking-tight">
          Configuración
        </h2>
      </div>
      <SettingsClient
        gym={gym}
        mpConfigured={mpConfig[0]?.mpConfigured ?? false}
        adminName={currentUser?.name ?? ""}
        adminEmail={currentUser?.email ?? ""}
      />
    </div>
  );
}
