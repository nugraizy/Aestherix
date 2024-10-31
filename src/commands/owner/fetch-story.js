import { generateWAMessageFromContent } from 'baileys';
import { readFileSync } from 'fs';

import configuration from '../../helper/config/connect.js';
import { textStory } from '../../helper/canvas/index.js';
import { Cache } from '../../helper/modules/cache.js';

const STATUS = 'status@broadcast';
const STATUS_PATH = `./src/media/connection_databases/${configuration.cli.input[0] ?? 'Session-debug'}.json`;

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'fetchstory',
	minifiedDescription: 'Fetch Story',
	description: 'Fetch story from host WhatsApp.',
	category: 'Owner',
	usage: '!fetchstory',
	aliases: ['getstory', 'getsw'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, groupMetadata }, client, store) {
		try {
			const messages = configuration.OPTIONS.json
				? JSON.parse(readFileSync(STATUS_PATH)).messages[STATUS]
				: store.loadMessages(STATUS);
			const tempContainer = new Cache();
			let caption = 'Fetch WhatsApp Story'.formatHeaders();
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
				return await client.instance.reply('Story not found', { from, quoted: message, groupMetadata });
			}

			caption += ` • ${
				data.stories?.extendedTextMessage?.[0].pushName ??
				data.stories?.imageMessage?.[0].pushName ??
				data.stories?.videoMessage?.[0].pushName
			}\n`;
			caption += `Texts : ${data.stories?.extendedTextMessage?.length ?? 0}\n`;
			caption += `Images : ${data.stories?.imageMessage?.length ?? 0}\n`;
			caption += `Videos : ${data.stories?.videoMessage?.length ?? 0}\n\n`;
			await client.instance.reply(caption.trim(), { from, quoted: message, groupMetadata });

			for (const type of Object.keys(data.stories)) {
				for (const message of data.stories[type]) {
					const body =
						message.message?.['extendedTextMessage']?.text ?? message.message?.[type]?.caption ?? 'Caption or texts N/A';

					if (type === 'extendedTextMessage') {
						const buffer = await textStory(body, message.message.extendedTextMessage.backgroundArgb);

						await client.instance.send(from, { image: buffer, caption: body }, { groupMetadata, quoted: message });
					} else {
						const messages = generateWAMessageFromContent(from, { ...message.message }, {});

						messages.message[type].caption = body;
						messages.message[type].contextInfo = {
							stanzaId: message.key.id,
							participant: message.key.participant,
							quotedMessage: message.message,
							remoteJid: message.key.remoteJid
						};
						await client.instance.relayMessage(from, messages.message, {
							cachedGroupMetadata: () => groupMetadata,
							messageId: messages.key.id
						});

						process.nextTick(() => {
							client.instance;
						});
					}
				}
			}
		} catch (err) {
			console.log(err);
		}
	}
};
