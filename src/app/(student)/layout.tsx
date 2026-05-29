// Layout para alumnos: Header + contenido + BottomNav fija
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as { id?: string; gymId?: string } | undefined;

  let gymName: string | undefined;
  let logoSrc: string | undefined;
  if (user?.gymId) {
    const gym = await prisma.gym.findUnique({
      where: { id: user.gymId },
      select: { name: true, logoUrl: true },
    });
    gymName = gym?.name ?? undefined;
    logoSrc = gym?.logoUrl ?? undefined;
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Header showCredits logoSrc={logoSrc} gymName={gymName} />
      <main className="flex-1 pb-28 max-w-2xl mx-auto w-full px-4">
        {/* pb-28 para que el contenido no quede detrás de la BottomNav */}
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
