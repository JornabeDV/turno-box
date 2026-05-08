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
      <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-10 text-center">
        <p className="text-sm text-[#6B8A99]">No hubo pagos aprobados hoy.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
      <div className="divide-y divide-[#1A4A63]">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
            {/* Alumno */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#EAEAEA] truncate leading-tight">
                {p.user.name ?? p.user.email}
              </p>
              {p.user.name && (
                <p className="text-[11px] text-[#4A6B7A] truncate">
                  {p.user.email}
                </p>
              )}
            </div>

            {/* Abono */}
            <span className="text-xs font-medium text-[#EAEAEA] shrink-0 hidden sm:block">
              {p.pack?.name ?? "—"}
            </span>

            {/* Vigencia */}
            {p.expiresAt ? (
              <span className="text-xs font-mono text-[#6B8A99] tabular-nums shrink-0">
                hasta{" "}
                {p.expiresAt.toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            ) : (
              <span className="text-xs text-[#4A6B7A] shrink-0">sin venc.</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
