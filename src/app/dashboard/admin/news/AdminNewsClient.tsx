"use client";

import { useRef } from "react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { NewsListClient, type NewsListRef } from "./NewsListClient";
import type { Announcement } from "@prisma/client";

type Props = {
  announcements: Announcement[];
};

export function AdminNewsClient({ announcements }: Props) {
  const newsRef = useRef<NewsListRef>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm text-[#6B8A99] uppercase tracking-wider mb-0.5">
            Admin
          </p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#EAEAEA] tracking-tight">
            Noticias
          </h2>
        </div>
        <Button
          variant="brand"
          size="md"
          onClick={() => newsRef.current?.openCreate()}
        >
          <PlusIcon size={14} weight="bold" />
          Nueva noticia
        </Button>
      </div>
      <NewsListClient ref={newsRef} announcements={announcements} />
    </div>
  );
}
