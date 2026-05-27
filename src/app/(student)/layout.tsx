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
      <Header showCredits logoSrc="/icons/nombre_logo.png?v=2" />
      <main className="flex-1 pb-28 max-w-2xl mx-auto w-full px-4">
        {/* pb-28 para que el contenido no quede detrás de la BottomNav */}
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
