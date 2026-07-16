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
      <div className="bg-card border border-border px-4 py-10 text-center">
        <p className="text-sm md:text-base text-secondary">No hay cumpleaños próximos.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border overflow-hidden">
      <div className="divide-y divide-border">
        {birthdays.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4">
            {/* Nombre */}
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base font-medium text-primary truncate leading-tight">
                {b.name ?? b.email}
              </p>
            </div>

            {/* Fecha */}
            <span className="text-xs md:text-sm font-mono text-secondary tabular-nums shrink-0">
              {formatBirthday(b.birthDate)}
            </span>

            {/* Badge días */}
            <span
              className={[
                "text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
                b.daysUntil === 0
                  ? "bg-brand/20 text-brand"
                  : "bg-card text-secondary",
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
