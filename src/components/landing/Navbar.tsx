import Link from "next/link";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#1A4A63] bg-[#0A1F2A]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto max-sm:px-4 h-14 flex items-center justify-between">
        <Link href="/landing" className="flex items-center">
          <img
            src="/icons/nombre_logo.png"
            alt="BoxTurno"
            className="h-7 w-auto"
          />
        </Link>
        <div className="hidden sm:flex items-center gap-6">
          <a
            href="#funciones"
            className="text-xs md:text-base font-[family-name:var(--font-oswald)] uppercase tracking-wider text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
          >
            Funciones
          </a>
          <a
            href="#como-funciona"
            className="text-xs md:text-base font-[family-name:var(--font-oswald)] uppercase tracking-wider text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
          >
            Cómo funciona
          </a>
          <a
            href="#precios"
            className="text-xs md:text-base font-[family-name:var(--font-oswald)] uppercase tracking-wider text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
          >
            Precios
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/gyms"
            className="text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wider border border-[#1A4A63] text-[#6B8A99] px-3 py-2 sm:px-4 hover:border-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
          >
            <span className="sm:hidden">Atleta</span>
            <span className="hidden sm:inline">Soy atleta</span>
          </Link>
          <Link
            href="/auth/login"
            className="text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wider bg-[#F78837] text-[#0A1F2A] px-3 py-2 sm:px-4 hover:bg-[#F78837]/90 transition-colors"
          >
            <span className="sm:hidden">Admin</span>
            <span className="hidden sm:inline">Ingresar admin</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
