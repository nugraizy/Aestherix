import configuration from '../../helper/config/connect.js';
import { S_WHATSAPP_NET } from '../../helper/index.js';
import prisma from '../../helper/database/prisma.js';
import { getBannedUsers, banUser } from '../../helper/database/adapters/user.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'banned',
	minifiedDescription: 'Ban User',
	description: 'Ban user.',
	usage: '!banned `<tag/reply>`',
	aliases: ['ban'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, isOwner, args, mediaData, mention, bodyQuoted, query }, client) {
		if (!query && bodyQuoted) {
			return await client.instance.reply(from, 'Please provide user to ban', message);
		}

		const userBanned = await getBannedUsers(prisma);
		const banned = [];

		if (args[1] === 'report' && isOwner) {
			await banUser(prisma, args[3]);
			configuration.cache.bannedlist.push(args[3]);
			configuration.cache.blocklist.push(args[3]);

			client.instance.updateBlockStatus(args[3], 'block');
			await client.instance.reply(
				from,
				'You are banned from using bot.\n\nReason : Abusing Report command.',
				JSON.parse(args.slice(4))
			);

			return;
		}

		if (mention.length) {
			for (const mentioned of mention) {
				if (userBanned.includes(mentioned)) {
					await client.instance.send(
						from,
						{ text: `@${mentioned.split('@')[0]} Already banned`, mentions: [mentioned] },
						{ quoted: message }
					);
					continue;
				}

				await banUser(prisma, mentioned);
				configuration.cache.bannedlist.push(mentioned);
				configuration.cache.blocklist.push(mentioned);
				banned.push(mentioned);
				await client.instance.updateBlockStatus(mentioned, 'block');
			}

			if (banned.length) {
				await client.instance.send(
					from,
					{ text: `Success banning : ${banned.map((v) => `@${v.split('@')[0]}`).join(', ')}`, mentions: [banned] },
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

				if (isBanned) {
					await client.instance.send(
						from,
						{ text: `@${number} is already banned`, mentions: [`${number}${S_WHATSAPP_NET}`] },
						{ quoted: message }
					);
					continue;
				}

				await banUser(prisma, `${number}${S_WHATSAPP_NET}`);
				configuration.cache.bannedlist.push(`${number}${S_WHATSAPP_NET}`);
				configuration.cache.blocklist.push(`${number}${S_WHATSAPP_NET}`);
				await client.instance.updateBlockStatus(`${number}${S_WHATSAPP_NET}`, 'block');
				await client.instance.send(
					from,
					{ text: `Success banning : @${number}`, mentions: [`${number}${S_WHATSAPP_NET}`] },
					{ quoted: message }
				);
			}

			return;
		}

		if (bodyQuoted) {
			if (userBanned.includes(mediaData.participant)) {
				return await client.instance.reply(from, 'Already banned', message);
			}

			await banUser(prisma, mediaData.participant);
			configuration.cache.bannedlist.push(mediaData.participant);
			configuration.cache.blocklist.push(mediaData.participant);
			await client.instance.updateBlockStatus(mediaData.participant, 'block');
			await client.instance.send(
				from,
				{ text: `Success banning : @${mediaData.participant.split('@')[0]}`, mentions: [mediaData.participant] },
				{ quoted: message }
			);
		}
	}
};
