import { runSingleTargetAction } from './_shared.js';

export const name = 'convert';

export const run = (ctx, client) => runSingleTargetAction({ ctx, client, roleId: 'alpha-werewolf', actionType: 'convert' });
