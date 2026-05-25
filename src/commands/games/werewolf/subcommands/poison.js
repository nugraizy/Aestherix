import { runSingleTargetAction } from './_shared.js';

export const name = 'poison';

export const run = (ctx, client) => runSingleTargetAction({ ctx, client, roleId: 'witch', actionType: 'poison' });
