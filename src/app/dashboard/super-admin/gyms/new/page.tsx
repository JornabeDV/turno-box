import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuperAdminCreateGymClient } from "./SuperAdminCreateGymClient";
import { BackButton } from "@/components/ui/BackButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Crear Gimnasio" };

export default async function SuperAdminCreateGymPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "SUPER_ADMIN") redirect("/");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackButton href="/dashboard/super-admin/gyms" />
        <div>
          <p className="text-xs md:text-sm text-secondary uppercase tracking-wider mb-0.5">
            Super Admin
          </p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary tracking-tight">
            Crear gimnasio
          </h2>
        </div>
      </div>

      <SuperAdminCreateGymClient />
    </div>
  );
}
