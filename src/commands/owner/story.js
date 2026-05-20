import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { defineCommand } from '../_define.js';

const STATUS = 'status@broadcast';

export default defineCommand({
	name: 'story',
	description: 'Fetch story from host WhatsApp.',
	category: 'Owner',
	usage: '!story',
	aliases: ['sw'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, prefix }, client, store) {
		const messages = store.loadMessages(STATUS);
		const tempContainer = new Cache();
		let caption = 'Fetch WhatsApp Story'.formatHeaders();

		caption += '\n\n';
		const rows = [];

		for (const message of messages) {
			const type = message.message ? Object.keys(message.message)[0] : undefined;

			if (!['extendedTextMessage', 'imageMessage', 'videoMessage'].includes(type)) {
				continue;
			}

			if (tempContainer.get(message.key.participant)) {
				if (tempContainer.get(message.key.participant).stories[type] === undefined) {
					tempContainer.get(message.key.participant).stories = {
						...tempContainer.get(message.key.participant).stories,
						[type]: [message]
					};
					tempContainer.get(message.key.participant).stories[type].push(message);
					continue;
				}

				tempContainer.get(message.key.participant).stories[type].push(message);
			} else {
				tempContainer.set(message.key.participant, {
					stories: {
						[type]: [message]
					}
				});
				rows.push({
					rows: [
						{
							title: 'Download',
							rowId: cmdId('fetchstory', message.key.participant, { prefix })
						}
					],
					title: `${__botName} | ${message?.pushName ?? 'No Name'}`
				});
			}
		}

		if (tempContainer.size === 0) {
			return await client.reply(from, 'No story are found.', message);
		}

		for (const value of Array.from(tempContainer.entries())) {
			caption += ` • ${
				value[1].stories?.extendedTextMessage?.[0].pushName ??
				value[1].stories?.imageMessage?.[0].pushName ??
				value[1].stories?.videoMessage?.[0].pushName ??
				'No Name'
			}\n`;
			caption += `Texts : ${value[1].stories?.extendedTextMessage?.length ?? 0}\n`;
			caption += `Images : ${value[1].stories?.imageMessage?.length ?? 0}\n`;
			caption += `Videos : ${value[1].stories?.videoMessage?.length ?? 0}\n\n`;
		}

		await client.send(
			from,
			{
				buttonText: 'Open List',
				title: caption.trim(),
				footer:
					'if you cannot click "read more" : click it first then reply the list, then click on the "x" mark on your reply.',
				text: '\t',
				sections: rows
			},
			{}
		);
	}
});
