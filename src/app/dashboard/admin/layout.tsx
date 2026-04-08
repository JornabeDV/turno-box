// Layout admin: Sidebar en desktop, header móvil
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Header } from "@/components/layout/Header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header title="Admin" showSignOut />
        <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
