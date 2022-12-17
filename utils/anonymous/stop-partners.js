import { skip } from './skip-partners.js';

/**
 * Stop current Anonymous session id.
 * @param {string} key string of the key/participant.
 * @param {number} timer timeout for how long the queue.
 * @param {Client} client socket connection.
 * @param {import('@adiwajshing/baileys').AnyMessageContent} message metadata of the message.
 * @returns
 */
export const stop = (key, timer, client, message) => {
	return skip(key, timer, client, message, true);
};
