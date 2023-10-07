import PhoneNumber from 'awesome-phonenumber';
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
	async run({ from, message, isOwner, mediaData, mention, bodyQuoted, query, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please provide user to unban', { from, quoted: message, groupMetadata });
		}

		if (!isOwner) {
			return await client[botNum].reply('You are not allowed to use this command', { from, quoted: message, groupMetadata });
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
			const reg = new RegExp('[A-Za-z-@s+s.whatsapp.net]', 'g');
			const checkIfValid = (input) => {
				const isValid = PhoneNumber(`+${input}`).isValid();

				return isValid;
			};

			query = query.includes(',') ? query.split(',') : [query];

			for (let user of query) {
				if (reg.test(user)) {
					user = user.replace(reg, '');
				}

				const validation = checkIfValid(user);
				const notBanned = userBanned.includes(`${user}${S_WHATSAPP_NET}`);

				if (!validation) {
					await client[botNum].send(from, {
						text: `@${user} is not a valid number`,
						mentions: [`${user}${S_WHATSAPP_NET}`]
					});
				} else if (!notBanned) {
					await client[botNum].send(
						from,
						{ text: `@${user} is not banned`, mentions: [`${user}${S_WHATSAPP_NET}`] },
						{ groupMetadata }
					);
				} else {
					const index = userBanned.indexOf(`${user}${S_WHATSAPP_NET}`);

					configuration.cache.bannedlist.splice(indexs(configuration.cache.bannedlist, `${user}${S_WHATSAPP_NET}`), 1);
					configuration.cache.blocklist.splice(indexs(configuration.cache.bannedlist, `${user}${S_WHATSAPP_NET}`), 1);
					userBanned.splice(index, 1);
					await fs.writeJSON('./databases/users/banned.json', userBanned);
					await client[botNum].updateBlockStatus(`${user}${S_WHATSAPP_NET}`, 'unblock');
					await client[botNum].send(
						from,
						{ text: `Success unbanning : @${user}`, mentions: [`${user}${S_WHATSAPP_NET}`] },
						{ groupMetadata, quoted: message }
					);
				}
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
