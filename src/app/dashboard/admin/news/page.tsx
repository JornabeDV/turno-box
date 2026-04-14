import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NewsListClient } from "./NewsListClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Noticias" };

export default async function AdminNewsPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const announcements = await prisma.announcement.findMany({
    where: { gymId: user.gymId },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Admin</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Noticias</h2>
      </div>
      <NewsListClient announcements={announcements} />
    </div>
  );
}
