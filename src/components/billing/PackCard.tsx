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
};

export function PackCard({ pack, index = 0 }: Props) {
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
    <div className="bg-[#0E2A38] border border-[#1A4A63] border-l-2" style={{ borderLeftColor: accentColor }}>
      <div className="p-5">
        {/* Header: nombre + badge */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-lg">
            {pack.name}
          </h3>
          <span
            className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider px-1.5 py-0.5 border"
            style={{ color: accentColor, borderColor: `${accentColor}40` }}
          >
            {badgeLabel}
          </span>
        </div>

        {/* Precio */}
        <div className="mb-1">
          <span className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] text-3xl uppercase tracking-tight">
            {priceFormatted.replace(pack.currency, "").trim()}
          </span>
        </div>

        {/* Validity */}
        {pack.validityDays && (
          <p className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#6B8A99] mb-4">
            {pack.validityDays} días válido
          </p>
        )}

        {/* Features */}
        {/* <ul className="space-y-2 mb-5">
          {features.map((feat, i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircle size={14} weight="regular" className="text-[#27C7B8] shrink-0" />
              <span className="text-xs text-[#EAEAEA] font-[family-name:var(--font-oswald)]">
                {feat}
              </span>
            </li>
          ))}
        </ul> */}

        {/* CTA */}
        <button
          onClick={handleBuy}
          disabled={isPending}
          className="w-full h-12 bg-[#F78837] text-[#0A1F2A] font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide text-sm active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="size-4 rounded-full border-2 border-[#0A1F2A] border-t-transparent animate-spin" />
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
