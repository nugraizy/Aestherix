import { BOT_NAME } from '../../core/constants.js';

import { Cache } from '../../helper/modules/cache.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Lo = useLocale(locale, 'owner');

		const messages = store.loadMessages(STATUS);
		const tempContainer = new Cache();
		let caption = Lo.titles.fetchStory.formatHeaders();

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
				title: `${BOT_NAME} | ${message?.pushName ?? Lo.labels.noName}`
				});
			}
		}

		if (tempContainer.size === 0) {
			return await client.reply(from, L.errors.noStory, message);
		}

		for (const value of Array.from(tempContainer.entries())) {
			caption += ` • ${
				value[1].stories?.extendedTextMessage?.[0].pushName ??
				value[1].stories?.imageMessage?.[0].pushName ??
				value[1].stories?.videoMessage?.[0].pushName ??
				Lo.labels.noName
			}\n`;
			caption += `${Lo.labels.texts} : ${value[1].stories?.extendedTextMessage?.length ?? 0}\n`;
			caption += `${Lo.labels.images} : ${value[1].stories?.imageMessage?.length ?? 0}\n`;
			caption += `${Lo.labels.videos} : ${value[1].stories?.videoMessage?.length ?? 0}\n\n`;
		}

		await client.send(
			from,
			{
				buttonText: Lo.labels.openList,
				title: caption.trim(),
				footer: Lo.labels.ifCannotClick,
				text: '\t',
				sections: rows
			},
			{}
		);
	}
});
