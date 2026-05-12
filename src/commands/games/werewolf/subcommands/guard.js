import { runSingleTargetAction } from './_shared.js';

export const name = 'guard';

export const run = (ctx, client) =>
	runSingleTargetAction({ ctx, client, roleId: 'guard', actionType: 'guard' });
