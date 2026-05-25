import { runSingleTargetAction } from './_shared.js';

export const name = 'shoot';

export const run = (ctx, client) => runSingleTargetAction({ ctx, client, roleId: 'hunter', actionType: 'shoot' });
