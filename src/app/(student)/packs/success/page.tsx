import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { approvePaymentIfValid } from "@/lib/approvePayment";
import { sendPushToUser } from "@/lib/push";
import Link from "next/link";
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

  // Si el webhook aún no llegó, acreditamos ahora mismo consultando MP directamente.
  // approvePaymentIfValid es idempotente — si el webhook ya lo procesó, no hace nada.
  if (payment.status !== "APPROVED") {
    const credited = await approvePaymentIfValid(payment.id);

    // Notificar push solo si acabamos de acreditar (el webhook lo haría si llega primero)
    if (credited) {
      sendPushToUser(payment.userId, {
        title: "¡Abono acreditado! 🎉",
        body: `Se sumaron ${payment.creditsGranted} crédito${payment.creditsGranted !== 1 ? "s" : ""} a tu cuenta.`,
        url: "/packs",
        tag: "payment-approved",
      }).catch(() => {});
    }
  }

  return (
    <section className="px-4 pt-16 pb-24 flex flex-col items-center text-center gap-6">
      <div className="size-20 rounded-3xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
          ¡Pago aprobado!
        </h2>
        <p className="text-zinc-500 mt-2">
          Se acreditaron{" "}
          <span className="text-emerald-400 font-bold">
            {payment.creditsGranted} clase{payment.creditsGranted !== 1 ? "s" : ""}
          </span>
          {payment.pack ? ` de ${payment.pack.name}` : ""} a tu cuenta.
        </p>
      </div>

      <Link
        href="/"
        className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-400 transition-colors active:scale-95"
      >
        Reservar una clase
      </Link>
    </section>
  );
}
