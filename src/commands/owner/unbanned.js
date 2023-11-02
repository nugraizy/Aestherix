import { findPhoneNumbersInText } from 'libphonenumber-js';
import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { S_WHATSAPP_NET } from '../../helper/index.js';

/**
 *
 * @param {string[]} arr
 * @param {string} id
 * @returns {number}
 */
const indexs = (arr, id) => arr.findIndex((v) => v === id);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'unbanned',
	description: 'Unbanned user',
	usage: '!unbanned <tag/reply>',
	aliases: ['unban'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, mediaData, mention, bodyQuoted, query, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please provide user to unban', { from, quoted: message, groupMetadata });
		}

		const userBanned = await fs.readJSON('./databases/users/banned.json');
		const unbanned = [];

		if (mention.length > 0) {
			for (const mentioned of mention) {
				if (!userBanned.includes(mentioned)) {
					await client[botNum].send(
						from,
						{ text: `@${mentioned.split('@')[0]} is not banned`, mentions: [mentioned] },
						{ groupMetadata, quoted: message }
					);
					continue;
				} else {
					const index = userBanned.indexOf(mentioned);

					configuration.cache.bannedlist.splice(indexs(configuration.cache.bannedlist, mentioned), 1);
					configuration.cache.blocklist.splice(indexs(configuration.cache.bannedlist, mentioned), 1);
					userBanned.splice(index, 1);
					await fs.writeJSON('./databases/users/banned.json', userBanned);
					unbanned.push(mentioned);
					await client[botNum].updateBlockStatus(mentioned, 'unblock');
				}
			}

			if (unbanned.length > 0) {
				await client[botNum].send(
					from,
					{ text: `Success unbanning : ${unbanned.map((v) => `@${v.split('@')[0]}`).join(', ')}`, mentions: [unbanned] },
					{ groupMetadata, quoted: message }
				);
			}

			return;
		}

		if (query) {
			const numbers = findPhoneNumbersInText(query);

			for (let user of numbers) {
				let {
					number: { number }
				} = user;

				number = number.replace(/\+/g, '');

				const isBanned = userBanned.includes(`${number}${S_WHATSAPP_NET}`);

				if (!isBanned) {
					await client[botNum].send(
						from,
						{ text: `@${number} is not banned`, mentions: [`${number}${S_WHATSAPP_NET}`] },
						{ groupMetadata }
					);
					continue;
				}

				const index = userBanned.indexOf(`${number}${S_WHATSAPP_NET}`);

				configuration.cache.bannedlist.splice(indexs(configuration.cache.bannedlist, `${number}${S_WHATSAPP_NET}`), 1);
				configuration.cache.blocklist.splice(indexs(configuration.cache.bannedlist, `${number}${S_WHATSAPP_NET}`), 1);
				userBanned.splice(index, 1);
				await fs.writeJSON('./databases/users/banned.json', userBanned);
				await client[botNum].updateBlockStatus(`${number}${S_WHATSAPP_NET}`, 'unblock');
				await client[botNum].send(
					from,
					{ text: `Success unbanning : @${number}`, mentions: [`${number}${S_WHATSAPP_NET}`] },
					{ groupMetadata, quoted: message }
				);
			}

			return;
		}

		if (bodyQuoted) {
			if (!userBanned.includes(mediaData.participant)) {
				return await client[botNum].reply('not banned', { from, quoted: message, groupMetadata });
			}

			const index = userBanned.indexOf(mediaData.participant);

			configuration.cache.bannedlist.splice(indexs(configuration.cache.bannedlist, mediaData.participant), 1);
			configuration.cache.blocklist.splice(indexs(configuration.cache.bannedlist, mediaData.participant), 1);
			userBanned.splice(index, 1);
			await fs.writeJSON('./databases/users/banned.json', userBanned);

			await client[botNum].updateBlockStatus(mediaData.participant, 'unblock');
			await client[botNum].send(
				from,
				{ text: `Success unbanning : @${mediaData.participant.split('@')[0]}`, mentions: [mediaData.participant] },
				{ quoted: message }
			);
		}
	}
};
