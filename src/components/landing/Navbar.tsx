import Link from "next/link";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#1A4A63] bg-[#0A1F2A]/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/landing"
          className="font-[family-name:var(--font-oswald)] font-bold text-[#F78837] uppercase tracking-tight text-lg"
        >
          TurnoBox
        </Link>
        <div className="hidden sm:flex items-center gap-6">
          <a
            href="#funciones"
            className="text-xs font-[family-name:var(--font-oswald)] uppercase tracking-wider text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
          >
            Funciones
          </a>
          <a
            href="#como-funciona"
            className="text-xs font-[family-name:var(--font-oswald)] uppercase tracking-wider text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
          >
            Cómo funciona
          </a>
          <a
            href="#precios"
            className="text-xs font-[family-name:var(--font-oswald)] uppercase tracking-wider text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
          >
            Precios
          </a>
        </div>
        <Link
          href="/auth/login"
          className="text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wider bg-[#F78837] text-[#0A1F2A] px-4 py-2 hover:bg-[#F78837]/90 transition-colors"
        >
          Ingresar
        </Link>
      </div>
    </nav>
  );
}
