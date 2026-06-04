import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NewsForm } from "../../NewsForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar noticia" };

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const { id } = await params;

  const announcement = await prisma.announcement.findFirst({
    where: { id, gymId: user.gymId },
  });

  if (!announcement) notFound();

  return <NewsForm announcement={announcement} />;
}
