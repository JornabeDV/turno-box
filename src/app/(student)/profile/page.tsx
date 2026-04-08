import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/layout/SignOutButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { user } = session;
  const roleLabel = { ADMIN: "Administrador", COACH: "Coach", STUDENT: "Alumno" }[
    (user as { role?: string }).role ?? "STUDENT"
  ] ?? "Alumno";

  return (
    <section className="px-4 pt-5">
      <div className="mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Cuenta</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Perfil</h2>
      </div>

      <div className="glass-card rounded-2xl p-5 mb-4 animate-in">
        {/* Avatar inicial */}
        <div className="flex items-center gap-4 mb-4">
          <div className="size-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xl font-bold text-orange-500">
            {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-semibold text-zinc-100">{user.name ?? "Sin nombre"}</p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-zinc-500">Rol</span>
            <span className="text-xs font-medium text-zinc-300">{roleLabel}</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <SignOutButton />
      </div>
    </section>
  );
}
