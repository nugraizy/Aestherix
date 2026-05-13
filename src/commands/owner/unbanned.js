import configuration from '../../helper/config/connect.js';
import { S_WHATSAPP_NET } from '../../helper/index.js';
import prisma from '../../helper/database/prisma.js';
import { getBannedUsers, unbanUser } from '../../helper/database/adapters/user.js';

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
	minifiedDescription: 'Unban User',
	description: 'Unbanned user.',
	usage: '!unbanned `<tag/reply user>`',
	aliases: ['unban'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, mediaData, mention, bodyQuoted, query }, client) {
		if (!query) {
			return await client.reply(from, 'Please provide user to unban', message);
		}

		const userBanned = await getBannedUsers(prisma);
		const unbanned = [];

		if (mention.length) {
			for (const mentioned of mention) {
				if (!userBanned.includes(mentioned)) {
					await client.send(
						from,
						{ text: `@${mentioned.split('@')[0]} is not banned`, mentions: [mentioned] },
						{ quoted: message }
					);
					continue;
				} else {
				await unbanUser(prisma, mentioned);
				configuration.bannedlist.splice(indexs(configuration.bannedlist, mentioned), 1);
				configuration.blocklist.splice(indexs(configuration.blocklist, mentioned), 1);
					unbanned.push(mentioned);
					await client.updateBlockStatus(mentioned, 'unblock');
				}
			}

			if (unbanned.length) {
				await client.send(
					from,
					{ text: `Success unbanning : ${unbanned.map((v) => `@${v.split('@')[0]}`).join(', ')}`, mentions: [unbanned] },
					{ quoted: message }
				);
			}

			return;
		}

		if (query) {
			const numbers = query.parseNumber();

			for (let user of numbers) {
				let {
					number: { number }
				} = user;

				number = number.replace(/\+/g, '');

				const isBanned = userBanned.includes(`${number}${S_WHATSAPP_NET}`);

				if (!isBanned) {
					await client.send(from, { text: `@${number} is not banned`, mentions: [`${number}${S_WHATSAPP_NET}`] }, {});
					continue;
				}

					await unbanUser(prisma, `${number}${S_WHATSAPP_NET}`);
				configuration.bannedlist.splice(indexs(configuration.bannedlist, `${number}${S_WHATSAPP_NET}`), 1);
				configuration.blocklist.splice(indexs(configuration.blocklist, `${number}${S_WHATSAPP_NET}`), 1);
				await client.updateBlockStatus(`${number}${S_WHATSAPP_NET}`, 'unblock');
				await client.send(
					from,
					{ text: `Success unbanning : @${number}`, mentions: [`${number}${S_WHATSAPP_NET}`] },
					{ quoted: message }
				);
			}

			return;
		}

		if (bodyQuoted) {
			if (!userBanned.includes(mediaData.participant)) {
				return await client.reply(from, 'not banned', message);
			}

			const index = userBanned.indexOf(mediaData.participant);

			await unbanUser(prisma, mediaData.participant);
			configuration.bannedlist.splice(indexs(configuration.bannedlist, mediaData.participant), 1);
			configuration.blocklist.splice(indexs(configuration.blocklist, mediaData.participant), 1);
			await client.updateBlockStatus(mediaData.participant, 'unblock');
			await client.send(
				from,
				{ text: `Success unbanning : @${mediaData.participant.split('@')[0]}`, mentions: [mediaData.participant] },
				{ quoted: message }
			);
		}
	}
};
