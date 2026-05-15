import configuration from '../../helper/config/connect.js';
import { S_WHATSAPP_NET } from '../../helper/index.js';
import prisma from '../../helper/database/prisma.js';
import { getBannedUsers, unbanUser } from '../../helper/database/adapters/user.js';

function removeFromArray(arr, value) {
	const index = arr.indexOf(value);

	if (index !== -1) {
		arr.splice(index, 1);
	}
}

async function unbanAndUnblock(client, jid) {
	await unbanUser(prisma, jid);
	removeFromArray(configuration.bannedlist, jid);
	removeFromArray(configuration.blocklist, jid);
	await client.updateBlockStatus(jid, 'unblock');
}

function mentionText(jid) {
	return `@${jid.split('@')[0]}`;
}

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
		if (!query && !bodyQuoted) {
			return await client.reply(from, 'Please provide user to unban', message);
		}

		const userBanned = await getBannedUsers(prisma);

		if (mention.length) {
			const unbanned = [];

			for (const jid of mention) {
				if (!userBanned.includes(jid)) {
					await client.send(from, { text: `${mentionText(jid)} is not banned`, mentions: [jid] }, { quoted: message });
					continue;
				}

				await unbanAndUnblock(client, jid);
				unbanned.push(jid);
			}

			if (unbanned.length) {
				await client.send(
					from,
					{ text: `Success unbanning : ${unbanned.map(mentionText).join(', ')}`, mentions: unbanned },
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

				if (!userBanned.includes(jid)) {
					await client.send(from, { text: `${mentionText(jid)} is not banned`, mentions: [jid] }, { quoted: message });
					continue;
				}

				await unbanAndUnblock(client, jid);
				await client.send(from, { text: `Success unbanning : ${mentionText(jid)}`, mentions: [jid] }, { quoted: message });
			}

			return;
		}

		if (bodyQuoted) {
			const jid = mediaData.participant;

			if (!userBanned.includes(jid)) {
				return await client.reply(from, 'Not banned', message);
			}

			await unbanAndUnblock(client, jid);
			await client.send(from, { text: `Success unbanning : ${mentionText(jid)}`, mentions: [jid] }, { quoted: message });
		}
	}
};
