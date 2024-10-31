import { skip } from './skip-partners.js';

/**
 * Stop current Anonymous session id.
 * @param {string} key string of the key/participant.
 * @param {number} timer timeout for how long the queue.
 * @param {import('../../types/Socket/index.js').AdvancedClient} client socket connection.
 * @param {import('baileys').AnyMessageContent} message metadata of the message.
 * @returns
 */
export const stop = (key, timer, client, message) => skip(key, timer, client, message, true);
