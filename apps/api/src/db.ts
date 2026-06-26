import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton. `tsx watch` re-imports modules on change in dev, so
 * we stash the instance on `globalThis` to avoid exhausting Postgres
 * connections with a new client per reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
