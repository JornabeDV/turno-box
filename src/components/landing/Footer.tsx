export function Footer() {
  return (
    <footer className="border-t border-border py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-[family-name:var(--font-oswald)] font-bold text-secondary uppercase tracking-tight text-sm lg:text-base">
          Box Turno
        </span>
        <div className="flex items-center gap-6">
          <span className="text-[10px] lg:text-xs text-muted font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
            © {new Date().getFullYear()}
          </span>
          <a
            href="#"
            className="hidden text-[10px] lg:text-xs text-muted font-[family-name:var(--font-jetbrains)] uppercase tracking-wider hover:text-secondary transition-colors"
          >
            Términos
          </a>
          <a
            href="#"
            className="hidden text-[10px] lg:text-xs text-muted font-[family-name:var(--font-jetbrains)] uppercase tracking-wider hover:text-secondary transition-colors"
          >
            Privacidad
          </a>
        </div>
      </div>
    </footer>
  );
}
