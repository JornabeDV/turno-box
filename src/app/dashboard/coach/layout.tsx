import { Header } from "@/components/layout/Header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;

  if (!user?.id || !["ADMIN", "COACH"].includes(user.role ?? "")) {
    redirect("/");
  }

  const gym = user.gymId
    ? await prisma.gym.findUnique({
        where: { id: user.gymId },
        select: { name: true, logoUrl: true },
      })
    : null;

  return (
    <div className="flex flex-col min-h-dvh">
      <Header showSignOut gymName={gym?.name} logoSrc={gym?.logoUrl ?? undefined} />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl lg:max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
