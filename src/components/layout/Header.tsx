import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { CreditsBadge } from "@/components/billing/CreditsBadge";

type HeaderProps = {
  showSignOut?: boolean;
  showCredits?: boolean;
  mobileMenuSlot?: React.ReactNode;
};

export async function Header({
  showSignOut = false,
  showCredits = false,
  mobileMenuSlot,
}: HeaderProps) {
  const session = await auth();

  let credits: number | null = null;
  if (showCredits && session?.user?.id) {
    const user = session.user as { id: string; gymId?: string };
    if (user.gymId) {
      const balance = await prisma.userCreditBalance.findUnique({
        where: { userId_gymId: { userId: user.id, gymId: user.gymId } },
        select: { availableCredits: true },
      });
      credits = balance?.availableCredits ?? 0;
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#1A4A63] bg-[#0A1F2A]">
      <div className="flex h-14 items-center justify-between px-4 md:px-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          {mobileMenuSlot}
          {/* Logo texto */}
          <h1 className="font-[family-name:var(--font-oswald)] font-bold italic text-[#F78837] uppercase tracking-tight text-4xl leading-none">
            Turno Box
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {credits !== null && <CreditsBadge credits={credits} />}
          {session?.user && (
            <span className="text-[11px] text-[#6B8A99] hidden sm:block font-[family-name:var(--font-jetbrains)] uppercase tracking-wide">
              {session.user.name ?? session.user.email}
            </span>
          )}
          {showSignOut && <SignOutButton iconOnly />}
        </div>
      </div>
    </header>
  );
}
