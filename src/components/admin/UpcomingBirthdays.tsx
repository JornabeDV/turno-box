type BirthdayRow = {
  id: string;
  name: string | null;
  email: string;
  birthDate: Date;
  daysUntil: number;
};

type Props = {
  birthdays: BirthdayRow[];
};

function formatBirthday(date: Date): string {
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

export function UpcomingBirthdays({ birthdays }: Props) {
  if (birthdays.length === 0) {
    return (
      <div className="glass-card rounded-2xl px-4 py-10 text-center">
        <p className="text-sm text-zinc-500">No hay cumpleaños próximos.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="divide-y divide-white/[0.04]">
        {birthdays.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-3.5">
            {/* Nombre */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate leading-tight">
                {b.name ?? b.email}
              </p>
              {b.name && (
                <p className="text-[11px] text-zinc-600 truncate">{b.email}</p>
              )}
            </div>

            {/* Fecha */}
            <span className="text-xs font-mono text-zinc-400 tabular-nums shrink-0">
              {formatBirthday(b.birthDate)}
            </span>

            {/* Badge días */}
            <span
              className={[
                "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                b.daysUntil === 0
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-zinc-800 text-zinc-400",
              ].join(" ")}
            >
              {b.daysUntil === 0 ? "¡Hoy!" : `en ${b.daysUntil}d`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
