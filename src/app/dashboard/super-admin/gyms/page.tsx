import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGymsListAction } from "@/actions/super-admin";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { Metadata } from "next";
import { GymsTableClient } from "./GymsTableClient";

export const metadata: Metadata = { title: "Gimnasios" };

export default async function SuperAdminGymsPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "SUPER_ADMIN") redirect("/");

  const gymsRes = await getGymsListAction();
  const gyms = gymsRes.success ? gymsRes.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/super-admin"
          className="text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-xs md:text-sm text-[#6B8A99] uppercase tracking-wider mb-0.5">
            Super Admin
          </p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#EAEAEA] tracking-tight">
            Gimnasios
          </h2>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/dashboard/super-admin/gyms/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F78837] text-[#0A1F2A] text-xs md:text-sm font-medium uppercase tracking-wide rounded-[2px] hover:bg-[#E07A2E] transition-colors"
        >
          + Crear gimnasio
        </Link>
      </div>

      <GymsTableClient gyms={gyms} />
    </div>
  );
}
