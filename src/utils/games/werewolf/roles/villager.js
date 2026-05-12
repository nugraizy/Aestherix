/**
 * Villager — no night action, no special powers.
 */

export const id = 'villager';

export const validate = () => ({ ok: false, reason: 'wrongAction' });

export const execute = () => ({ ok: false, reason: 'wrongAction' });
