/**
 * Prisma Config — SQL databases (PostgreSQL / MySQL / SQLite)
 *
 * Set DATABASE_PROVIDER and DATABASE_URL in your .env file.
 * Then run:
 *   npm run db:generate      # generate Prisma Client
 *   npm run db:migrate        # create + apply migrations (dev)
 *   npm run db:migrate:deploy # apply pending migrations (prod)
 *   npm run db:push           # push schema without migration history
 *   npm run db:studio         # open Prisma Studio
 *
 * @see https://www.prisma.io/docs/orm/reference/prisma-config-reference
 */

import { config } from '@dotenvx/dotenvx';
import { defineConfig } from 'prisma/config';

// Load .env before accessing process.env
config({ quiet: true });

export default defineConfig({
	schema: 'prisma/schema.prisma',

	migrations: {
		path: 'prisma/migrations'
	},

	datasource: {
		url: process.env.DATABASE_URL ?? ''
	}
});
