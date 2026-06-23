import { generateWAMessageFromContent } from 'baileys';

import { TextStory } from '../../helper/canvas/index.js';
import { Cache } from '../../helper/modules/cache.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const STATUS = 'status@broadcast';

export default defineCommand({
	name: 'fetchstory',
	minifiedDescription: 'Fetch Story',
	description: 'Fetch story from host WhatsApp.',
	category: 'Owner',
	usage: '!fetchstory',
	aliases: ['getstory', 'getsw'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, query }, client, store) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Lo = useLocale(locale, 'owner');

		try {
			const messages = store.loadMessages(STATUS);
			const tempContainer = new Cache();
			let caption = Lo.titles.fetchStory.formatHeaders();
			let i = 0;

			caption += '\n\n';

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
						index: i,
						stories: {
							[type]: [message]
						}
					});
					i++;
				}
			}

			const data =
				tempContainer.get(query) ||
				Array.from(tempContainer.values().values).find((v) => v.index === Number(query) - 1) ||
				null;

			if (!data) {
				return await client.reply(from, L.errors.noStory, message);
			}

			caption += ` • ${
				data.stories?.extendedTextMessage?.[0].pushName ??
				data.stories?.imageMessage?.[0].pushName ??
				data.stories?.videoMessage?.[0].pushName
			}\n`;
			caption += `${Lo.labels.texts} : ${data.stories?.extendedTextMessage?.length ?? 0}\n`;
			caption += `${Lo.labels.images} : ${data.stories?.imageMessage?.length ?? 0}\n`;
			caption += `${Lo.labels.videos} : ${data.stories?.videoMessage?.length ?? 0}\n\n`;
			await client.reply(from, caption.trim(), message);

			for (const type of Object.keys(data.stories)) {
				for (const message of data.stories[type]) {
					const body =
						message.message?.['extendedTextMessage']?.text ?? message.message?.[type]?.caption ?? 'Caption or texts N/A';

					if (type === 'extendedTextMessage') {
						const story = new TextStory();
						const buffer = await story.render(body, message.message.extendedTextMessage.backgroundArgb);

						await client.send(from, { image: buffer, caption: body }, { quoted: message });
					} else {
						const messages = generateWAMessageFromContent(
							from,
							{ ...message.message },
							{ messageId: client.generateMessageID() }
						);

						messages.message[type].caption = body;
						messages.message[type].contextInfo = {
							stanzaId: message.key.id,
							participant: message.key.participant,
							quotedMessage: message.message,
							remoteJid: message.key.remoteJid
						};
						await client.relay(from, messages.message, {
							messageId: messages.key.id
						});

						process.nextTick(() => {
							client;
						});
					}
				}
			}
		} catch (err) {
			loggers.error(color('Fetch story failed:', 'red'), err);
		}
	}
});
