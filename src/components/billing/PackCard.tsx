"use client";

import { useTransition } from "react";
import { createCheckoutAction } from "@/actions/payments";

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
  disabled?: boolean;
  redirectToWhatsApp?: boolean;
  phone?: string | null;
  gymName?: string | null;
  bankAlias?: string | null;
  bankAccountHolder?: string | null;
  studentName?: string | null;
};

function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function buildWhatsAppMessage(
  pack: SerializedPack,
  gymName?: string | null,
  bankAlias?: string | null,
  bankAccountHolder?: string | null,
  studentName?: string | null
): string {
  const price = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: pack.currency,
    maximumFractionDigits: 0,
  }).format(Number(pack.price));
  const gym = gymName ? ` de ${gymName.trim()}` : "";
  const alias = bankAlias?.trim();
  const holder = bankAccountHolder?.trim();
  const student = studentName?.trim();
  const studentText = student ? `Soy ${student}. ` : "";

  if (alias) {
    const holderText = holder ? ` (a nombre de ${holder})` : "";
    return `Hola${gym}. ${studentText}Quiero comprar el abono "${pack.name.trim()}" (${pack.credits} clases) por ${price}. Te transfiero al alias ${alias}${holderText} y te adjunto el comprobante. ¿Me podés cargar el abono?`;
  }

  return `Hola${gym}. ${studentText}Quiero comprar el abono "${pack.name.trim()}" (${pack.credits} clases) por ${price}. ¿Me pasás los datos para coordinar el pago?`;
}

export function PackCard({
  pack,
  disabled = false,
  redirectToWhatsApp = false,
  phone = null,
  gymName = null,
  bankAlias = null,
  bankAccountHolder = null,
  studentName = null,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleBuy() {
    if (redirectToWhatsApp) {
      if (!phone) return;
      const cleaned = cleanPhone(phone);
      if (!cleaned) return;
      const href = `https://wa.me/${cleaned}?text=${encodeURIComponent(buildWhatsAppMessage(pack, gymName, bankAlias, bankAccountHolder, studentName))}`;
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

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

  const buttonText = disabled
    ? "No disponible"
    : redirectToWhatsApp
      ? "Pagar por WhatsApp"
      : isPending
        ? "Procesando..."
        : "Seleccionar Plan";

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
          {isPending && !redirectToWhatsApp ? (
            <span className="flex items-center justify-center gap-2">
              <span className="size-4 rounded-full border-2 border-page border-t-transparent animate-spin" />
              Procesando...
            </span>
          ) : (
            buttonText
          )}
        </button>
      </div>
    </div>
  );
}
