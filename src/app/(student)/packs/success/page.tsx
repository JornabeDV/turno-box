import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PaymentSuccessClient } from "./PaymentSuccessClient";

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

  return <PaymentSuccessClient paymentId={paymentId} />;
}
