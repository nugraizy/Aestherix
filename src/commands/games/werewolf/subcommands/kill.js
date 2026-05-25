import { runSingleTargetAction } from './_shared.js';

export const name = 'kill';

export const run = (ctx, client) => runSingleTargetAction({ ctx, client, roleId: 'werewolf', actionType: 'kill' });
