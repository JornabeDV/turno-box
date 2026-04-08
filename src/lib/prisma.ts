import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  const url = process.env.DATABASE_URL!;
  const log = process.env.NODE_ENV === "development"
    ? ["error" as const, "warn" as const]
    : ["error" as const];

  if (url.includes("neon.tech")) {
    // Producción / Neon: usa el adapter serverless (HTTP/WebSocket)
    const { PrismaNeon } = require("@prisma/adapter-neon") as typeof import("@prisma/adapter-neon");
    const adapter = new PrismaNeon({ connectionString: url });
    return new PrismaClient({ adapter, log });
  }

  // Desarrollo local: Postgres estándar via TCP usando adapter-pg
  const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
  const adapter = new PrismaPg(url);
  return new PrismaClient({ adapter, log });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
