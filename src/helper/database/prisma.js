import { PrismaClient } from '@prisma/client';

const globalForPrisma = /** @type {typeof globalThis & { __prisma?: PrismaClient }} */ (globalThis);

const prisma =
	globalForPrisma.__prisma ??
	new PrismaClient({
		datasourceUrl: process.env.DATABASE_URL,
		log:
			process.env.NODE_ENV === 'development'
				? [{ emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
				: [{ emit: 'stdout', level: 'error' }]
	});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.__prisma = prisma;
}

export default prisma;

