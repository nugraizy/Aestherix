/**
 * Prisma Config — auto-selects schema based on DATABASE_PROVIDER.
 *
 * Set DATABASE_PROVIDER and DATABASE_URL in your .env file.
 *   - DATABASE_PROVIDER="mongodb"  → prisma/schema.mongodb.prisma
 *   - any other provider           → prisma/schema.prisma  (postgresql/mysql/sqlite)
 *
 * All `prisma ...` commands (generate, db push, migrate, studio) now pick
 * the right schema automatically, so `npm install` regenerates the correct
 * client when you switch DATABASE_PROVIDER.
 *
 * Usage:
 *   npm run db:generate       # generate Prisma Client
 *   npm run db:push           # push schema (works for both SQL and Mongo)
 *   npm run db:migrate        # SQL only (Mongo does not support migrate)
 *   npm run db:studio         # open Prisma Studio
 *
 * @see https://www.prisma.io/docs/orm/reference/prisma-config-reference
 */

import { config } from '@dotenvx/dotenvx';
import { defineConfig } from 'prisma/config';

config({ quiet: true });

const provider = String(process.env.DATABASE_PROVIDER || '').toLowerCase();
const isMongo = provider === 'mongodb' || provider === 'mongo';

const schema = isMongo ? 'prisma/schema.mongodb.prisma' : 'prisma/schema.prisma';

const baseConfig = {
	schema,
	datasource: {
		url: process.env.DATABASE_URL ?? ''
	}
};

if (!isMongo) {
	baseConfig.migrations = { path: 'prisma/migrations' };
}

export default defineConfig(baseConfig);
