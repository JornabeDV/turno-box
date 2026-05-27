export function Footer() {
  return (
    <footer className="border-t border-[#1A4A63] py-8 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-[family-name:var(--font-oswald)] font-bold text-[#6B8A99] uppercase tracking-tight text-sm">
          Box Turno
        </span>
        <div className="flex items-center gap-6">
          <span className="text-[10px] text-[#4A6B7A] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
            © {new Date().getFullYear()}
          </span>
          <a
            href="#"
            className="text-[10px] text-[#4A6B7A] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider hover:text-[#6B8A99] transition-colors"
          >
            Términos
          </a>
          <a
            href="#"
            className="text-[10px] text-[#4A6B7A] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider hover:text-[#6B8A99] transition-colors"
          >
            Privacidad
          </a>
        </div>
      </div>
    </footer>
  );
}
