type PaymentRow = {
  id: string;
  user: { name: string | null; email: string };
  pack: { name: string };
  expiresAt: Date | null;
};

type Props = {
  payments: PaymentRow[];
};

export function TodayPaymentsTable({ payments }: Props) {
  if (payments.length === 0) {
    return (
      <div className="glass-card rounded-2xl px-4 py-10 text-center">
        <p className="text-sm text-zinc-500">No hubo pagos aprobados hoy.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="divide-y divide-white/[0.04]">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
            {/* Alumno */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate leading-tight">
                {p.user.name ?? p.user.email}
              </p>
              {p.user.name && (
                <p className="text-[11px] text-zinc-600 truncate">{p.user.email}</p>
              )}
            </div>

            {/* Abono */}
            <span className="text-xs font-medium text-zinc-300 shrink-0 hidden sm:block">
              {p.pack.name}
            </span>

            {/* Vigencia */}
            {p.expiresAt ? (
              <span className="text-xs font-mono text-zinc-500 tabular-nums shrink-0">
                hasta {p.expiresAt.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            ) : (
              <span className="text-xs text-zinc-600 shrink-0">sin venc.</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
