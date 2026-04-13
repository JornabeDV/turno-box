import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  const log = process.env.NODE_ENV === "development"
    ? ["error" as const, "warn" as const]
    : ["error" as const];

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  if (url.includes("neon.tech")) {
    // Producción / Neon: usa HTTP (no WebSocket) — recomendado para serverless
    const { PrismaNeonHttp } = require("@prisma/adapter-neon") as typeof import("@prisma/adapter-neon");
    const adapter = new PrismaNeonHttp(url, {});
    return new PrismaClient({ adapter, log });
  }

  // Desarrollo local: Postgres estándar via TCP usando adapter-pg
  const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
  const adapter = new PrismaPg(url);
  return new PrismaClient({ adapter, log });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Lazy singleton: createPrismaClient() is deferred until the first DB call,
// so build-time module evaluation doesn't crash when DATABASE_URL is absent.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    const client = globalForPrisma.prisma;
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as Function).bind(client) : value;
  },
});
