type PaymentRow = {
  id: string;
  user: { name: string | null; email: string };
  pack: { name: string } | null;
  expiresAt: Date | null;
};

type Props = {
  payments: PaymentRow[];
};

export function TodayPaymentsTable({ payments }: Props) {
  if (payments.length === 0) {
    return (
      <div className="bg-card border border-border px-4 py-10 text-center">
        <p className="text-sm md:text-base text-secondary">No hubo pagos aprobados hoy.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border overflow-hidden">
      <div className="divide-y divide-border">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4">
            {/* Alumno */}
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base font-medium text-primary truncate leading-tight">
                {p.user.name ?? p.user.email}
              </p>
            </div>

            {/* Abono */}
            <span className="text-xs md:text-sm font-medium text-primary shrink-0 hidden sm:block">
              {p.pack?.name ?? "—"}
            </span>

            {/* Vigencia */}
            {p.expiresAt ? (
              <span className="text-xs md:text-sm font-mono text-secondary tabular-nums shrink-0">
                hasta{" "}
                {p.expiresAt.toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            ) : (
              <span className="text-xs md:text-sm text-muted shrink-0">sin venc.</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
