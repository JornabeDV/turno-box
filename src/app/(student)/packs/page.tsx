import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PackCard } from "@/components/billing/PackCard";
import { PaymentToast } from "@/components/billing/PaymentToast";
import { CreditCard, Fingerprint, Lock } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Comprar clases" };

export default async function PacksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  const session = await auth();
  const user = session?.user as { id?: string; gymId?: string } | undefined;
  if (!user?.id || !user.gymId) redirect("/auth/login");

  const { error, info } = await searchParams;

  const packs = await prisma.pack.findMany({
    where: { gymId: user.gymId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { credits: "asc" }],
  });

  return (
    <section className="space-y-5 pt-4">
      <PaymentToast error={error} info={info} />

      {/* Header */}
      <div>
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl">
          Comprar abonos
        </h2>
        <p className="text-sm text-[#6B8A99] mt-1 font-[family-name:var(--font-oswald)]">
          Seleccioná el plan que mejor se adapte a tu entrenamiento.
        </p>
      </div>

      {/* Lista de packs */}
      {packs.length === 0 ? (
        <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-16 text-center">
          <p className="text-sm text-[#6B8A99] font-[family-name:var(--font-oswald)] uppercase tracking-wide">
            No hay abonos disponibles en este momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {packs.map((pack, i) => (
            <PackCard
              key={pack.id}
              pack={{ ...pack, price: Number(pack.price) }}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Custom Plan */}
      <div className="bg-[#0E2A38] border border-[#F78837]/30 p-5 text-center">
        <h3 className="font-[family-name:var(--font-oswald)] font-bold text-[#F78837] uppercase tracking-tight text-lg mb-2">
          Custom Plan
        </h3>
        <p className="text-xs text-[#6B8A99] mb-4 font-[family-name:var(--font-oswald)] max-w-xs mx-auto">
          Looking for a specialized enterprise plan or long-term training commitment? Let&apos;s talk.
        </p>
        <a
          href="mailto:contacto@beebox.com"
          className="inline-flex items-center px-5 py-2.5 border border-[#F78837] text-[#F78837] text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide hover:bg-[#F78837] hover:text-[#0A1F2A] transition-colors"
        >
          Contact Sales
        </a>
      </div>

      {/* Footer de seguridad */}
      <div className="pt-4 border-t border-[#1A4A63]">
        <div className="flex items-center justify-center gap-6 mb-2">
          <CreditCard size={20} className="text-[#4A6B7A]" />
          <Fingerprint size={20} className="text-[#4A6B7A]" />
          <Lock size={20} className="text-[#4A6B7A]" />
        </div>
        <p className="text-center text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#4A6B7A]">
          Secure encrypted payments
        </p>
      </div>
    </section>
  );
}
