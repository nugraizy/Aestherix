import configuration from '../../helper/config/connect.js';
import { S_WHATSAPP_NET } from '../../helper/index.js';
import prisma from '../../helper/database/prisma.js';
import { getBannedUsers, banUser } from '../../helper/database/adapters/user.js';

async function banAndBlock(client, jid) {
	await banUser(prisma, jid);
	configuration.bannedlist.push(jid);
	configuration.blocklist.push(jid);
	await client.updateBlockStatus(jid, 'block');
}

function mentionText(jid) {
	return `@${jid.split('@')[0]}`;
}

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
		if (!query && !bodyQuoted) {
			return await client.reply(from, 'Please provide user to ban', message);
		}

		const userBanned = await getBannedUsers(prisma);

		if (args[1] === 'report' && isOwner) {
			await banAndBlock(client, args[3]);
			await client.reply(from, 'You are banned from using bot.\n\nReason : Abusing Report command.', JSON.parse(args.slice(4)));
			return;
		}

		if (mention.length) {
			const banned = [];

			for (const jid of mention) {
				if (userBanned.includes(jid)) {
					await client.send(from, { text: `${mentionText(jid)} Already banned`, mentions: [jid] }, { quoted: message });
					continue;
				}

				await banAndBlock(client, jid);
				banned.push(jid);
			}

			if (banned.length) {
				await client.send(
					from,
					{ text: `Success banning : ${banned.map(mentionText).join(', ')}`, mentions: banned },
					{ quoted: message }
				);
			}

			return;
		}

		if (query) {
			const numbers = query.parseNumber();

			for (const user of numbers) {
				const number = user.number.number.replace(/\+/g, '');
				const jid = `${number}${S_WHATSAPP_NET}`;

				if (userBanned.includes(jid)) {
					await client.send(from, { text: `${mentionText(jid)} is already banned`, mentions: [jid] }, { quoted: message });
					continue;
				}

				await banAndBlock(client, jid);
				await client.send(from, { text: `Success banning : ${mentionText(jid)}`, mentions: [jid] }, { quoted: message });
			}

			return;
		}

		if (bodyQuoted) {
			const jid = mediaData.participant;

			if (userBanned.includes(jid)) {
				return await client.reply(from, 'Already banned', message);
			}

			await banAndBlock(client, jid);
			await client.send(from, { text: `Success banning : ${mentionText(jid)}`, mentions: [jid] }, { quoted: message });
		}
	}
};
