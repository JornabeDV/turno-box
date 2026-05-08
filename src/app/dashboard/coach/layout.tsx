import { Header } from "@/components/layout/Header";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header showSignOut />
      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
