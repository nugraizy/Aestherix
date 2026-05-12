/**
 * Jester — no night action. Winning condition is checked in `logic/win.js`
 * when the player is lynched during voting.
 */

export const id = 'jester';

export const validate = () => ({ ok: false, reason: 'wrongAction' });

export const execute = () => ({ ok: false, reason: 'wrongAction' });
