import { skip } from './skip-partners.js';

/**
 * Stop current Anonymous session id.
 * @param {string} key string of the key/participant.
 * @param {import('../../types/Socket/index.js').AdvancedClient} client socket connection.
 * @returns {false | {partner1: string, partner2: string} | {status: string, seconds: number}}
 */
export const stop = (key, client) => skip(key, 0, client, undefined, true);
