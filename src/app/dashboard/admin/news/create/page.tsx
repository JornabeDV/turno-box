import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewsForm } from "../NewsForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nueva noticia" };

export default async function CreateNewsPage() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  return <NewsForm />;
}
