import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGymsListAction } from "@/actions/super-admin";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { Metadata } from "next";
import { CopyInviteButton } from "./CopyInviteButton";

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
          <p className="text-xs text-[#6B8A99] uppercase tracking-wider mb-0.5">
            Super Admin
          </p>
          <h2 className="text-xl font-bold text-[#EAEAEA] tracking-tight">
            Gimnasios
          </h2>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/dashboard/super-admin/gyms/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F78837] text-[#0A1F2A] text-xs font-medium uppercase tracking-wide rounded-[2px] hover:bg-[#E07A2E] transition-colors"
        >
          + Crear gimnasio
        </Link>
      </div>

      {gyms.length === 0 ? (
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-8 text-center">
          <p className="text-sm text-[#6B8A99]">
            No hay gimnasios registrados todavía.
          </p>
        </div>
      ) : (
        <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A4A63]">
                  <th className="text-left text-xs font-medium text-[#6B8A99] uppercase tracking-wider px-4 py-3">
                    Nombre
                  </th>
                  <th className="text-left text-xs font-medium text-[#6B8A99] uppercase tracking-wider px-4 py-3">
                    Slug
                  </th>
                  <th className="text-left text-xs font-medium text-[#6B8A99] uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                    Usuarios
                  </th>
                  <th className="text-left text-xs font-medium text-[#6B8A99] uppercase tracking-wider px-4 py-3">
                    Link de invitación
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A4A63]">
                {gyms.map((gym) => {
                  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${gym.slug}`;
                  return (
                    <tr key={gym.id} className="hover:bg-[#0A1F2A]/50 transition-colors">
                      <td className="px-4 py-3 text-[#EAEAEA] font-medium">
                        {gym.name}
                      </td>
                      <td className="px-4 py-3 text-[#6B8A99] font-[family-name:var(--font-jetbrains)] text-xs">
                        {gym.slug}
                      </td>
                      <td className="px-4 py-3 text-[#EAEAEA] hidden sm:table-cell">
                        {gym._count.users}
                      </td>
                      <td className="px-4 py-3">
                        <CopyInviteButton slug={gym.slug} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
