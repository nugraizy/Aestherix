import { runSingleTargetAction } from './_shared.js';

export const name = 'heal';

export const run = (ctx, client) =>
	runSingleTargetAction({ ctx, client, roleId: 'witch', actionType: 'heal' });
