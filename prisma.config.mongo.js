/**
 * Prisma Config — MongoDB
 *
 * Set DATABASE_URL=mongodb+srv://... in your .env file.
 * Then run:
 *   npm run db:generate:mongo  # generate Prisma Client
 *   npm run db:push:mongo      # push schema to MongoDB (migrate not supported)
 *
 * NOTE: `prisma migrate` is NOT supported for MongoDB. Always use `db push`.
 *
 * @see https://www.prisma.io/docs/orm/reference/prisma-config-reference
 */

import { config } from '@dotenvx/dotenvx';
import { defineConfig } from 'prisma/config';

// Load .env before accessing process.env
config({ quiet: true });

export default defineConfig({
	schema: 'prisma/schema.mongodb.prisma',

	datasource: {
		url: process.env.DATABASE_URL ?? ''
	}
});
