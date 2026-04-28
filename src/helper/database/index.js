/**
 * Central re-export for the database layer.
 *
 * Import the Prisma client:
 *   import prisma from './src/helper/database/index.js'
 *
 * Import auth helpers:
 *   import { useMultiAuthState, useSingleAuthState } from './src/helper/database/index.js'
 *
 * Import domain adapters:
 *   import { getUserLimit, banUser, ... } from './src/helper/database/index.js'
 *
 * @module database
 */

export { default as prisma } from './prisma.js';
export { useMultiAuthState, useSingleAuthState } from './auth.js';
export * from './adapters/user.js';
export * from './adapters/group-settings.js';
export * from './adapters/dashboard.js';
export * from './adapters/command-usage.js';
export * from './adapters/dashboard-settings.js';
