import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pago exitoso" };

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const session = await auth();
  const user = session?.user as { id?: string; gymId?: string } | undefined;
  if (!user?.id) redirect("/auth/login");

  const { payment: paymentId } = await searchParams;

  const payment = paymentId
    ? await prisma.payment.findFirst({
        where: { id: paymentId, userId: user.id },
        select: { status: true, creditsGranted: true, pack: { select: { name: true } } },
      })
    : null;

  const approved = payment?.status === "APPROVED";

  return (
    <section className="px-4 pt-16 pb-24 flex flex-col items-center text-center gap-6">
      <div className={`size-20 rounded-3xl flex items-center justify-center ${
        approved ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"
      }`}>
        {approved ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
          </svg>
        )}
      </div>

      {approved ? (
        <>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">¡Pago aprobado!</h2>
            <p className="text-zinc-500 mt-2">
              Se acreditaron{" "}
              <span className="text-emerald-400 font-bold">{payment.creditsGranted} clases</span>
              {" "}de {payment.pack.name} a tu cuenta.
            </p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-400 transition-colors active:scale-95"
          >
            Reservar una clase
          </Link>
        </>
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Procesando pago</h2>
            <p className="text-zinc-500 mt-2">
              Tu pago está siendo verificado. Los créditos se acreditarán en unos minutos.
            </p>
          </div>
          <Link
            href="/packs"
            className="px-6 py-3 bg-zinc-800 text-zinc-200 rounded-xl font-semibold text-sm hover:bg-zinc-700 transition-colors"
          >
            Volver a packs
          </Link>
        </>
      )}
    </section>
  );
}
