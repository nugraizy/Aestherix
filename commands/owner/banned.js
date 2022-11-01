/* global botNum */
import PhoneNumber from 'awesome-phonenumber';

import configuration from '../../connect.js';
import { readJSON, writeJSON, S_WHATSAPP_NET } from '../../helper/index.js';

export default {
	name: 'banned',
	description: 'Banned user',
	usage: '!banned <tag/reply>',
	aliases: ['ban'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, isOwner, args, mediaData, mention, bodyQuoted, query }, client) {
		if (!query && bodyQuoted) {
			return await client[botNum].reply({ from, quoted: message }, 'Please provide user to ban');
		}

		if (!isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not allowed to use this command');
		}

		const userBanned = readJSON('./databases/users/banned.json');
		const banned = [];

		if (args[1] == 'report' && isOwner) {
			userBanned.push(args[3]);
			configuration.cache.bannedlist.push(args[3]);
			configuration.cache.blocklist.push(args[3]);
			writeJSON('./databases/users/banned.json', userBanned);

			client[botNum].updateBlockStatus(args[3], 'block');
			await client[botNum].reply({ from, quoted: JSON.parse(args.slice(4)) }, 'You are banned from using bot.\n\nReason : Abusing Report command.');

			return;
		}

		if (mention.length > 0) {
			for (const mentioned of mention) {
				if (userBanned.includes(mentioned)) {
					await client[botNum].sendMessage(from, { text: `@${mentioned.split('@')[0]} Already banned`, mentions: [mentioned] }, { quoted: message });
					continue;
				} else {
					configuration.cache.bannedlist.push(mentioned);
					configuration.cache.blocklist.push(mentioned);
					userBanned.push(mentioned);
					writeJSON('./databases/users/banned.json', userBanned);
					banned.push(mentioned);
					await client[botNum].updateBlockStatus(mentioned, 'block');
				}
			}

			if (banned.length > 0) {
				await client[botNum].sendMessage(from, { text: `Success banning : ${banned.map((v) => `@${v.split('@')[0]}`).join(', ')}`, mentions: [banned] }, { quoted: message });
			}

			return;
		}

		if (query) {
			const reg = new RegExp('[A-Za-z-@s+s.whatsapp.net]', 'g');

			const checkIfValid = (input) => {
				const isValid = PhoneNumber(`+${input}`).isValid();

				return isValid;
			};

			if (query.includes(',')) {
				query = query.split(',');
			} else {
				query = [query];
			}

			for (let user of query) {
				if (reg.test(user)) {
					user = user.replace(reg, '');
				}

				const validation = checkIfValid(user);
				const notBanned = userBanned.includes(`${user}${S_WHATSAPP_NET}`);

				if (!validation) {
					await client[botNum].sendMessage(from, { text: `@${user} is not a valid number`, mentions: [`${user}${S_WHATSAPP_NET}`] }, { quoted: message });
				} else if (notBanned) {
					await client[botNum].sendMessage(from, { text: `@${user} is already banned`, mentions: [`${user}${S_WHATSAPP_NET}`] }, { quoted: message });
				} else {
					configuration.cache.bannedlist.push(`${user}${S_WHATSAPP_NET}`);
					configuration.cache.blocklist.push(`${user}${S_WHATSAPP_NET}`);
					userBanned.push(`${user}${S_WHATSAPP_NET}`);
					writeJSON('./databases/users/banned.json', userBanned);
					await client[botNum].updateBlockStatus(`${user}${S_WHATSAPP_NET}`, 'block');
					await client[botNum].sendMessage(from, { text: `Success banning : @${user}`, mentions: [`${user}${S_WHATSAPP_NET}`] }, { quoted: message });
				}
			}

			return;
		}

		if (bodyQuoted) {
			if (userBanned.includes(mediaData.participant)) {
				return await client[botNum].reply({ from, quoted: message }, 'Already banned');
			}

			configuration.cache.bannedlist.push(mediaData.participant);
			configuration.cache.blocklist.push(mediaData.participant);
			userBanned.push(mediaData.participant);
			writeJSON('./databases/users/banned.json', userBanned);
			await client[botNum].updateBlockStatus(mediaData.participant, 'block');
			await client[botNum].sendMessage(from, { text: `Success banning : @${mediaData.participant.split('@')[0]}`, mentions: [mediaData.participant] }, { quoted: message });
		}
	},
};
