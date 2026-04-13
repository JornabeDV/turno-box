import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { CreditsBadge } from "@/components/billing/CreditsBadge";

type HeaderProps = {
  title: string;
  showSignOut?: boolean;
  showCredits?: boolean;
  mobileMenuSlot?: React.ReactNode;
};

export async function Header({ title, showSignOut = false, showCredits = false, mobileMenuSlot }: HeaderProps) {
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
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0f0f0f]/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 md:px-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          {mobileMenuSlot}
          {/* Logo / marca */}
          <span className="size-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5h11M6.5 17.5h11M12 2v20M2 12h4M18 12h4"/>
            </svg>
          </span>
          <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {credits !== null && <CreditsBadge credits={credits} />}
          {session?.user && (
            <span className="text-xs text-zinc-500 hidden sm:block">
              {session.user.name ?? session.user.email}
            </span>
          )}
          {showSignOut && <SignOutButton />}
        </div>
      </div>
    </header>
  );
}
