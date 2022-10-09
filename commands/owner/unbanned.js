/* global botNum */
import PhoneNumber from 'awesome-phonenumber';

import { readJSON, writeJSON } from '../../helper/index.js';

export default {
	name: 'unbanned',
	description: 'Unbanned user',
	usage: '!unbanned <tag/reply>',
	aliases: ['unban'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, isOwner, mediaData, mention, bodyQuoted, query }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please provide user to unban');
		}

		if (!isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not allowed to use this command');
		}

		const userBanned = readJSON('./databases/users/banned.json');
		const unbanned = [];

		if (mention.length > 0) {
			for (const mentioned of mention) {
				if (!userBanned.includes(mentioned)) {
					await client[botNum].sendMessage(from, { text: `@${mentioned.split('@')[0]} is not banned`, mentions: [mentioned] }, { quoted: message });
					continue;
				} else {
					const index = userBanned.indexOf(mentioned);

					userBanned.splice(index, 1);
					writeJSON('./databases/users/banned.json', userBanned);
					unbanned.push(mentioned);
				}
			}

			if (unbanned.length > 0) {
				await client[botNum].sendMessage(from, { text: `Success unbanning : ${unbanned.map((v) => `@${v.split('@')[0]}`).join(', ')}`, mentions: [unbanned] }, { quoted: message });
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
				const notBanned = userBanned.includes(`${user}@s.whatsapp.net`);

				if (!validation) {
					await client[botNum].sendMessage(from, { text: `@${user} is not a valid number`, mentions: [`${user}@s.whatsapp.net`] });
				} else if (!notBanned) {
					await client[botNum].sendMessage(from, { text: `@${user} is not banned`, mentions: [`${user}@s.whatsapp.net`] });
				} else {
					const index = userBanned.indexOf(`${user}@s.whatsapp.net`);

					userBanned.splice(index, 1);
					writeJSON('./databases/users/banned.json', userBanned);

					await client[botNum].sendMessage(from, { text: `Success unbanning : @${user}`, mentions: [`${user}@s.whatsapp.net`] }, { quoted: message });
				}
			}

			return;
		}

		if (bodyQuoted) {
			if (!userBanned.includes(mediaData.participant)) {
				return await client[botNum].reply({ from, quoted: message }, 'not banned');
			}

			const index = userBanned.indexOf(mediaData.participant);

			userBanned.splice(index, 1);
			writeJSON('./databases/users/banned.json', userBanned);

			client[botNum].updateBlockStatus(mediaData.participant, 'unblock');
			await client[botNum].sendMessage(from, { text: `Success unbanning : @${mediaData.participant.split('@')[0]}`, mentions: [mediaData.participant] }, { quoted: message });
		}
	},
};
