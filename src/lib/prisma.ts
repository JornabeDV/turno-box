import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  const log: Array<"error" | "warn"> =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  if (url.includes("neon.tech")) {
    // Producción / Neon: el adapter crea y maneja el Pool internamente.
    // Configurar WebSockets es necesario para soportar $transaction.
    const { neonConfig } = require("@neondatabase/serverless") as typeof import("@neondatabase/serverless");
    const { PrismaNeon } = require("@prisma/adapter-neon") as typeof import("@prisma/adapter-neon");
    const ws = require("ws");

    neonConfig.webSocketConstructor = ws;
    const adapter = new PrismaNeon({ connectionString: url });
    return new PrismaClient({ adapter, log });
  }

  // Desarrollo local: Postgres estándar vía TCP usando adapter-pg.
  const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter, log });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
