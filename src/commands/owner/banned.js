import { findPhoneNumbersInText } from 'libphonenumber-js';

import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { S_WHATSAPP_NET } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'banned',
	description: 'Banned user',
	usage: '!banned <tag/reply>',
	aliases: ['ban'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, isOwner, args, mediaData, mention, bodyQuoted, query, groupMetadata }, client) {
		if (!query && bodyQuoted) {
			return await client[botNum].reply('Please provide user to ban', { from, quoted: message, groupMetadata });
		}

		const userBanned = await fs.readJSON('./databases/users/banned.json');
		const banned = [];

		if (args[1] === 'report' && isOwner) {
			userBanned.push(args[3]);
			configuration.cache.bannedlist.push(args[3]);
			configuration.cache.blocklist.push(args[3]);
			await fs.writeJSON('./databases/users/banned.json', userBanned);

			client[botNum].updateBlockStatus(args[3], 'block');
			await client[botNum].reply('You are banned from using bot.\n\nReason : Abusing Report command.', {
				from,
				quoted: JSON.parse(args.slice(4)),
				groupMetadata
			});

			return;
		}

		if (mention.length > 0) {
			for (const mentioned of mention) {
				if (userBanned.includes(mentioned)) {
					await client[botNum].send(
						from,
						{ text: `@${mentioned.split('@')[0]} Already banned`, mentions: [mentioned] },
						{ groupMetadata, quoted: message }
					);
					continue;
				}

				configuration.cache.bannedlist.push(mentioned);
				configuration.cache.blocklist.push(mentioned);
				userBanned.push(mentioned);
				await fs.writeJSON('./databases/users/banned.json', userBanned);
				banned.push(mentioned);
				await client[botNum].updateBlockStatus(mentioned, 'block');
			}

			if (banned.length > 0) {
				await client[botNum].send(
					from,
					{ text: `Success banning : ${banned.map((v) => `@${v.split('@')[0]}`).join(', ')}`, mentions: [banned] },
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

				if (isBanned) {
					await client[botNum].send(
						from,
						{ text: `@${number} is already banned`, mentions: [`${number}${S_WHATSAPP_NET}`] },
						{ groupMetadata, quoted: message }
					);
					continue;
				}

				configuration.cache.bannedlist.push(`${number}${S_WHATSAPP_NET}`);
				configuration.cache.blocklist.push(`${number}${S_WHATSAPP_NET}`);
				userBanned.push(`${number}${S_WHATSAPP_NET}`);
				await fs.writeJSON('./databases/users/banned.json', userBanned);
				await client[botNum].updateBlockStatus(`${number}${S_WHATSAPP_NET}`, 'block');
				await client[botNum].send(
					from,
					{ text: `Success banning : @${number}`, mentions: [`${number}${S_WHATSAPP_NET}`] },
					{ groupMetadata, quoted: message }
				);
			}

			return;
		}

		if (bodyQuoted) {
			if (userBanned.includes(mediaData.participant)) {
				return await client[botNum].reply('Already banned', { from, quoted: message, groupMetadata });
			}

			configuration.cache.bannedlist.push(mediaData.participant);
			configuration.cache.blocklist.push(mediaData.participant);
			userBanned.push(mediaData.participant);
			await fs.writeJSON('./databases/users/banned.json', userBanned);
			await client[botNum].updateBlockStatus(mediaData.participant, 'block');
			await client[botNum].send(
				from,
				{ text: `Success banning : @${mediaData.participant.split('@')[0]}`, mentions: [mediaData.participant] },
				{ groupMetadata, quoted: message }
			);
		}
	}
};
