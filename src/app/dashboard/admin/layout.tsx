// Layout admin: Sidebar en desktop, drawer en mobile
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminMobileNav } from "@/components/layout/AdminMobileNav";
import { Header } from "@/components/layout/Header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
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
    <div className="flex min-h-dvh">
      <AdminSidebar logoSrc={logoSrc} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header showSignOut mobileMenuSlot={<AdminMobileNav logoSrc={logoSrc} />} logoSrc={logoSrc} gymName={gymName} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl lg:max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
