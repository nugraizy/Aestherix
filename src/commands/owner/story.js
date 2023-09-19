import { readFileSync } from 'fs';

import configuration from '../../helper/config/connect.js';
import { Cache } from '../../helper/modules/cache.js';

const STATUS = 'status@broadcast';
const STATUS_PATH = `./src/media/connection_databases/${configuration.cli.input[0] ?? 'Session-debug'}.json`;

export default {
	name: 'story',
	description: 'Fetch story from host WhatsApp.',
	category: 'Owner',
	usage: '!story',
	aliases: ['sw'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, isOwner, groupMetadata }, client, store) {
		if (!isOwner) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You are not allowed to use this command');
		}

		const messages = configuration.OPTIONS.json
			? JSON.parse(readFileSync(STATUS_PATH)).messages[STATUS]
			: await store.loadMessages(STATUS);
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
							rowId: `.fetchstory ${message.key.participant}`
						}
					],
					title: `VOID BOT | ${message?.pushName ?? 'No Name'}`
				});
			}
		}

		if (tempContainer.size === 0) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'No story are found.');
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

		await client[botNum].send(
			from,
			{
				buttonText: 'Open List',
				title: caption.trim(),
				footer:
					'if you cannot click "read more" : click it first then reply the list, then click on the "x" mark on your reply.',
				text: '\t',
				sections: rows
			},
			{ groupMetadata }
		);
	}
};
