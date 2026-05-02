import type { PrismaClient } from "@prisma/client";

// Lazy import so importing this module doesn't fail before `prisma generate`
// has been run. Call getPrisma() once you actually need the client.
let cached: PrismaClient | undefined;

export async function getPrisma(): Promise<PrismaClient> {
  if (cached) return cached;
  const mod = await import("@prisma/client");
  cached = new mod.PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"]
  });
  return cached;
}
