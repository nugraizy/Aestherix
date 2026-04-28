import { PrismaClient } from '@prisma/client';

/**
 * Global Prisma client singleton.
 *
 * In development, the module cache is cleared on hot-reload (e.g. nodemon),
 * which would spawn a new PrismaClient on every reload and exhaust the
 * database connection pool.  Attaching the instance to `globalThis` prevents
 * that without affecting production builds.
 *
 * The generated client reads DATABASE_URL from process.env automatically.
 */

const globalForPrisma = /** @type {typeof globalThis & { __prisma?: PrismaClient }} */ (globalThis);

const prisma =
	globalForPrisma.__prisma ??
	new PrismaClient({
		log:
			process.env.NODE_ENV === 'development'
				? [{ emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
				: [{ emit: 'stdout', level: 'error' }]
	});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.__prisma = prisma;
}

export default prisma;


