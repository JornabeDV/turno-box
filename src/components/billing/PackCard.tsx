"use client";

import { useTransition } from "react";
import { createCheckoutAction } from "@/actions/payments";
import { CheckCircle } from "@phosphor-icons/react";

type SerializedPack = {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  validityDays: number | null;
  description?: string | null;
};

type Props = {
  pack: SerializedPack;
  index?: number;
  disabled?: boolean;
};

export function PackCard({ pack, index = 0, disabled = false }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleBuy() {
    startTransition(async () => {
      const res = await createCheckoutAction(pack.id);
      if (res.success) {
        window.location.href = res.data.checkoutUrl;
      } else {
        alert(res.error);
      }
    });
  }

  const priceFormatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: pack.currency,
    maximumFractionDigits: 0,
  }).format(Number(pack.price));

  // Color de acento según cantidad de clases
  let accentColor: string;
  let badgeLabel: string;
  if (pack.credits < 10) {
    accentColor = "#E61919";
    badgeLabel = `${pack.credits} clases`;
  } else if (pack.credits <= 15) {
    accentColor = "#F78837";
    badgeLabel = `${pack.credits} clases`;
  } else {
    accentColor = "#27C7B8";
    badgeLabel = `${pack.credits} clases`;
  }

  // Features mock basados en el pack (en producción vendrían de la DB)
  // const features = isPro
  //   ? [
  //       `${pack.credits} units included`,
  //       "Performance review",
  //       "Nutrition guide access",
  //     ]
  //   : [
  //       "Professional coaching",
  //       "Priority access",
  //     ];

  return (
    <div className="bg-card border border-border border-l-2" style={{ borderLeftColor: accentColor }}>
      <div className="p-5 md:p-8">
        {/* Header: nombre + badge */}
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <h3 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-lg md:text-2xl">
            {pack.name}
          </h3>
          <span
            className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider px-1.5 py-0.5 md:px-2.5 md:py-1 border"
            style={{ color: accentColor, borderColor: `${accentColor}40` }}
          >
            {badgeLabel}
          </span>
        </div>

        {/* Precio */}
        <div className="mb-1 md:mb-2">
          <span className="font-[family-name:var(--font-oswald)] font-bold text-primary text-3xl md:text-4xl uppercase tracking-tight">
            {priceFormatted.replace(pack.currency, "").trim()}
          </span>
        </div>

        {/* Validity */}
        {pack.validityDays && (
          <p className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-secondary mb-4 md:mb-6">
            {pack.validityDays} días válido
          </p>
        )}

        {/* Features */}
        {/* <ul className="space-y-2 mb-5">
          {features.map((feat, i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircle size={14} weight="regular" className="text-success shrink-0" />
              <span className="text-xs text-primary font-[family-name:var(--font-oswald)]">
                {feat}
              </span>
            </li>
          ))}
        </ul> */}

        {/* CTA */}
        <button
          onClick={handleBuy}
          disabled={isPending || disabled}
          className="w-full h-12 md:h-14 bg-brand text-page font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide text-sm md:text-base active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          {disabled ? (
            "No disponible"
          ) : isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="size-4 rounded-full border-2 border-page border-t-transparent animate-spin" />
              Procesando...
            </span>
          ) : (
            "Seleccionar Plan"
          )}
        </button>
      </div>
    </div>
  );
}
