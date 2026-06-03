// Layout super-admin: Sidebar en desktop, drawer en mobile
import { SuperAdminSidebar } from "@/components/layout/SuperAdminSidebar";
import { SuperAdminMobileNav } from "@/components/layout/SuperAdminMobileNav";
import { Header } from "@/components/layout/Header";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <SuperAdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header showSignOut mobileMenuSlot={<SuperAdminMobileNav />} logoSrc="/icons/nombre_logo.png?v=2" />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl lg:max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
