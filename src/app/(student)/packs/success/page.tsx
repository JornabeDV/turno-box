import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { approvePaymentIfValid } from "@/lib/approvePayment";
import { sendPushToUser } from "@/lib/push";
import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pago exitoso" };

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) redirect("/auth/login");

  const { payment: paymentId } = await searchParams;
  if (!paymentId) redirect("/packs");

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId: user.id },
    select: { id: true, status: true, creditsGranted: true, userId: true, pack: { select: { name: true } } },
  });
  if (!payment) redirect("/packs");

  if (payment.status !== "APPROVED") {
    const credited = await approvePaymentIfValid(payment.id);
    if (credited) {
      sendPushToUser(payment.userId, {
        title: "Abono acreditado",
        body: `Se sumaron ${payment.creditsGranted} crédito${payment.creditsGranted !== 1 ? "s" : ""} a tu cuenta.`,
        url: "/packs",
        tag: "payment-approved",
      }).catch(() => {});
    }
  }

  return (
    <section className="px-4 pt-16 pb-24 flex flex-col items-center text-center gap-6">
      <div className="size-20 border border-[#27C7B8]/30 bg-[#27C7B8]/10 flex items-center justify-center">
        <CheckCircle size={32} className="text-[#27C7B8]" weight="bold" />
      </div>

      <div>
        <h2 className="text-2xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight">
          Pago aprobado
        </h2>
        <p className="text-[#6B8A99] mt-2 font-[family-name:var(--font-oswald)]">
          Se acreditaron{" "}
          <span className="text-[#27C7B8] font-bold">
            {payment.creditsGranted} clase{payment.creditsGranted !== 1 ? "s" : ""}
          </span>
          {payment.pack ? ` de ${payment.pack.name}` : ""} a tu cuenta.
        </p>
      </div>

      <Link
        href="/"
        className="px-6 py-3 bg-[#F78837] text-[#0A1F2A] font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide text-sm hover:bg-[#E07A2E] transition-colors active:scale-[0.98]"
      >
        Reservar una clase
      </Link>
    </section>
  );
}
