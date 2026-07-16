"use client";

import { useRouter } from "next/navigation";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { NewsListClient } from "./NewsListClient";
import type { Announcement } from "@prisma/client";

type Props = {
  announcements: Announcement[];
};

export function AdminNewsClient({ announcements }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm text-secondary uppercase tracking-wider mb-0.5">
            Admin
          </p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary tracking-tight">
            Noticias
          </h2>
        </div>
        <Button
          variant="brand"
          size="md"
          onClick={() => router.push("/dashboard/admin/news/create")}
        >
          <PlusIcon size={14} weight="bold" />
          Nueva noticia
        </Button>
      </div>
      <NewsListClient announcements={announcements} />
    </div>
  );
}
