import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { CreditsBadge } from "@/components/billing/CreditsBadge";

type HeaderProps = {
  showSignOut?: boolean;
  showCredits?: boolean;
  mobileMenuSlot?: React.ReactNode;
  logoSrc?: string;
  gymName?: string;
};

export async function Header({
  showSignOut = false,
  showCredits = false,
  mobileMenuSlot,
  logoSrc,
  gymName,
}: HeaderProps) {
  const session = await auth();
  const gymSlug = (session?.user as { gymSlug?: string | null } | undefined)?.gymSlug;
  const signOutUrl = gymSlug ? `/auth/login?gymSlug=${gymSlug}` : "/auth/login";

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
    <header className="sticky top-0 z-40 border-b border-[#1A4A63] bg-[#0A1F2A] safe-area-top">
      <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6 lg:px-8 max-w-5xl lg:max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          {mobileMenuSlot}
          {/* Nombre del box */}
          {gymName ? (
            <span className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-xl leading-none">
              {gymName}
            </span>
          ) : logoSrc ? (
            <img
              src={logoSrc}
              alt="BoxTurno"
              className="h-7 md:h-9 w-auto"
            />
          ) : (
            <h1 className="font-[family-name:var(--font-oswald)] font-bold italic text-[#F78837] uppercase tracking-tight text-4xl leading-none">
              Box Turno
            </h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          {credits !== null && <CreditsBadge credits={credits} />}
          {session?.user && (
            <span className="text-[11px] md:text-xs text-[#6B8A99] hidden sm:block font-[family-name:var(--font-jetbrains)] uppercase tracking-wide">
              {session.user.name ?? session.user.email}
            </span>
          )}
          {showSignOut && <SignOutButton iconOnly callbackUrl={signOutUrl} />}
        </div>
      </div>
    </header>
  );
}
