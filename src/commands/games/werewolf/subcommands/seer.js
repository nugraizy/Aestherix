import { runSingleTargetAction } from './_shared.js';

export const name = 'seer';

export const run = (ctx, client) => runSingleTargetAction({ ctx, client, roleId: 'seer', actionType: 'seer' });
