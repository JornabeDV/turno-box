"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

export async function searchGymsAction(
  query?: string
): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
      address: string | null;
      phone: string | null;
    }>
  >
> {
  const gyms = await prisma.gym.findMany({
    where: query
      ? {
          name: { contains: query, mode: "insensitive" },
        }
      : undefined,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      address: true,
      phone: true,
    },
  });

  return { success: true, data: gyms };
}
