import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuperAdminCreateGymClient } from "./SuperAdminCreateGymClient";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Crear Gimnasio" };

export default async function SuperAdminCreateGymPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "SUPER_ADMIN") redirect("/");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/super-admin/gyms"
          className="text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-xs text-[#6B8A99] uppercase tracking-wider mb-0.5">
            Super Admin
          </p>
          <h2 className="text-xl font-bold text-[#EAEAEA] tracking-tight">
            Crear gimnasio
          </h2>
        </div>
      </div>

      <SuperAdminCreateGymClient />
    </div>
  );
}
