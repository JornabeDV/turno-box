import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminNewsClient } from "./AdminNewsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Noticias" };

export default async function AdminNewsPage() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const announcements = await prisma.announcement.findMany({
    where: { gymId: user.gymId },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
  });

  return <AdminNewsClient announcements={announcements} />;
}
