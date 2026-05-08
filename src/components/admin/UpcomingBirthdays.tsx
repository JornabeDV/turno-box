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
      <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-10 text-center">
        <p className="text-sm text-[#6B8A99]">No hay cumpleaños próximos.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
      <div className="divide-y divide-[#1A4A63]">
        {birthdays.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-3.5">
            {/* Nombre */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#EAEAEA] truncate leading-tight">
                {b.name ?? b.email}
              </p>
              {b.name && (
                <p className="text-[11px] text-[#4A6B7A] truncate">{b.email}</p>
              )}
            </div>

            {/* Fecha */}
            <span className="text-xs font-mono text-[#6B8A99] tabular-nums shrink-0">
              {formatBirthday(b.birthDate)}
            </span>

            {/* Badge días */}
            <span
              className={[
                "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                b.daysUntil === 0
                  ? "bg-[#F78837]/20 text-[#F78837]"
                  : "bg-[#0E2A38] text-[#6B8A99]",
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
