"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchGymsAction } from "@/actions/gyms";
import { Button } from "@/components/ui/Button";
import { Barbell, MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";

interface Gym {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
}

interface Props {
  initialGyms: Gym[];
  initialQuery: string;
}

export function GymDiscoveryClient({ initialGyms, initialQuery }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [gyms, setGyms] = useState<Gym[]>(initialGyms);
  const [isPending, startTransition] = useTransition();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await searchGymsAction(query.trim() || undefined);
      if (result.success) {
        setGyms(result.data);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full h-12 bg-page border border-border pl-10 pr-4 text-sm sm:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand transition-colors rounded-[2px] font-[family-name:var(--font-oswald)]"
          />
        </div>
        <Button type="submit" loading={isPending} className="shrink-0">
          Buscar
        </Button>
      </form>

      {/* Resultados */}
      {gyms.length === 0 ? (
        <div className="border border-border bg-card p-6 text-center">
          <Barbell size={32} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-secondary font-[family-name:var(--font-oswald)]">
            No encontramos gimnasios{query ? ` con "${query}"` : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gyms.map((gym) => (
            <button
              key={gym.id}
              onClick={() => router.push(`/auth/login?gymSlug=${gym.slug}`)}
              className="w-full flex items-center gap-4 border border-border bg-card p-4 hover:border-secondary transition-colors text-left cursor-pointer"
            >
              {/* Logo */}
              <div className="shrink-0 w-14 h-14 rounded-xl border border-border bg-page overflow-hidden flex items-center justify-center p-1.5">
                {gym.logoUrl ? (
                  <img
                    src={gym.logoUrl}
                    alt={gym.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Barbell size={24} className="text-brand" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-base sm:text-lg truncate">
                  {gym.name}
                </h3>
                {gym.address && (
                  <p className="text-xs sm:text-sm text-secondary truncate font-[family-name:var(--font-oswald)]">
                    {gym.address}
                  </p>
                )}
              </div>

              {/* CTA */}
              <span className="shrink-0 inline-flex items-center gap-1.5 bg-brand text-page px-4 py-2.5 text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide">
                Entrar
                <ArrowRight size={14} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
