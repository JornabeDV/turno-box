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
};

type Props = { pack: SerializedPack };

export function PackCard({ pack }: Props) {
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

  const pricePerClass = (Number(pack.price) / pack.credits).toFixed(0);

  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
      {/* Clases count */}
      <div className="size-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col items-center justify-center shrink-0">
        <span className="text-2xl font-black text-orange-400 leading-none">{pack.credits}</span>
        <span className="text-[10px] text-orange-500/70 font-medium uppercase tracking-wide mt-0.5">clases</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 text-sm">{pack.name}</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {priceFormatted}
          <span className="text-zinc-700"> · ${pricePerClass}/clase</span>
        </p>
        {pack.validityDays && (
          <p className="text-xs text-zinc-600 mt-1">
            Válido {pack.validityDays} días desde la compra
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={handleBuy}
        disabled={isPending}
        className="px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-400 active:scale-95 transition-all disabled:opacity-50 shrink-0"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Espera…
          </span>
        ) : (
          priceFormatted
        )}
      </button>
    </div>
  );
}
