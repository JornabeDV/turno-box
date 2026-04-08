// Layout para alumnos: Header + contenido + BottomNav fija
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header title="CrossFit Turnos" showSignOut />
      <main className="flex-1 pb-28">
        {/* pb-28 para que el contenido no quede detrás de la BottomNav */}
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
