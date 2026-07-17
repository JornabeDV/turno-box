import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/ui/BackButton";
import { CopyButton } from "@/components/ui/CopyButton";
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
  const user = session?.user as { id?: string; gymId?: string; name?: string } | undefined;
  if (!user?.id || !user.gymId) redirect("/auth/login");

  const { error, info } = await searchParams;

  const [packs, gym] = await Promise.all([
    prisma.pack.findMany({
      where: { gymId: user.gymId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { credits: "asc" }],
    }),
    prisma.gym.findUnique({
      where: { id: user.gymId },
      select: {
        name: true,
        phone: true,
        mpAccessToken: true,
        mpEnabled: true,
        bankAlias: true,
        bankAccountHolder: true,
      },
    }),
  ]);

  const mpConfigured = Boolean(gym?.mpAccessToken?.trim());
  const onlinePaymentsEnabled = mpConfigured && (gym?.mpEnabled ?? true);
  const redirectToWhatsApp = !onlinePaymentsEnabled;

  return (
    <section className="space-y-5 md:space-y-8 pt-4 md:pt-8">
      <BackButton href="/" />
      <PaymentToast error={error} info={info} />

      {/* Header */}
      <div>
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl md:text-4xl">
          Comprar abonos
        </h2>
        <p className="text-sm md:text-lg text-secondary mt-1 md:mt-2 font-[family-name:var(--font-oswald)]">
          Seleccioná el plan que mejor se adapte a tu entrenamiento.
        </p>
      </div>

      {/* Estado de configuración de pagos */}
      {redirectToWhatsApp && (
        <div className="bg-card border border-brand/40 px-4 py-6 md:px-6 md:py-8">
          <p className="text-sm md:text-base text-brand font-[family-name:var(--font-oswald)] uppercase tracking-wide">
            Contactar la administración para comprar abonos
          </p>
          {gym?.bankAlias && (
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-page border border-border">
              <p className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-secondary">
                Transferir al alias
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-[family-name:var(--font-jetbrains)] text-sm md:text-base text-primary break-all flex-1">
                  {gym.bankAlias}
                </p>
                <CopyButton value={gym.bankAlias} label="Alias" />
              </div>
              {gym?.bankAccountHolder && (
                <p className="mt-2 text-xs md:text-sm text-secondary font-[family-name:var(--font-jetbrains)]">
                  A nombre de: <span className="text-primary">{gym.bankAccountHolder}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de packs */}
      {packs.length === 0 ? (
        <div className="bg-card border border-border px-4 py-16 md:px-6 md:py-20 text-center">
          <p className="text-sm md:text-base text-secondary font-[family-name:var(--font-oswald)] uppercase tracking-wide">
            No hay abonos disponibles en este momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={{ ...pack, price: Number(pack.price) }}
              redirectToWhatsApp={redirectToWhatsApp}
              phone={gym?.phone ?? null}
              gymName={gym?.name ?? null}
              bankAlias={gym?.bankAlias ?? null}
              bankAccountHolder={gym?.bankAccountHolder ?? null}
              studentName={user?.name ?? null}
              disabled={!onlinePaymentsEnabled && !gym?.phone}
            />
          ))}
        </div>
      )}
      {/* Footer de seguridad */}
      <div className="pt-4 md:pt-6 border-t border-border">
        <div className="flex items-center justify-center gap-6 md:gap-8 mb-2 md:mb-3">
          <CreditCard size={20} className="text-muted md:size-7" />
          <Fingerprint size={20} className="text-muted md:size-7" />
          <Lock size={20} className="text-muted md:size-7" />
        </div>
        <p className="text-center text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-muted">
          Pagos seguros cifrados con SSL. Tus datos están protegidos.
        </p>
      </div>
    </section>
  );
}
