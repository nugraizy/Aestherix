/* global cli, botNum, OPTIONS, log */
import { generateWAMessageFromContent } from '@adiwajshing/baileys';
import { readFileSync } from 'fs';

import { textStory } from '../../Helper/Canvas/index.js';

const STATUS = 'status@broadcast';
const STATUS_PATH = `./Media Files/Connection Databases/${cli.input[0] ?? 'Session-debug'}.json`;

export default {
	name: 'fetchstory',
	description: 'Fetch story from host WhatsApp.',
	category: 'Owner',
	usage: '!fetchstory',
	aliases: ['getstory', 'getsw'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, isOwner, query }, client, store) {
		if (!isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not allowed to use this command');
		}

		try {
			const messages = OPTIONS.json ? JSON.parse(readFileSync(STATUS_PATH)).messages[STATUS] : await store.loadMessages(STATUS);
			const tempContainer = new Map();
			let caption = '``` • Fetch WhatsApp Story```\n\n';
			let i = 0;

			for (const message of messages) {
				const type = message.message ? Object.keys(message.message)[0] : undefined;

				if (!['extendedTextMessage', 'imageMessage', 'videoMessage'].includes(type)) {
					continue;
				}

				if (tempContainer.get(message.key.participant)) {
					if (tempContainer.get(message.key.participant).stories[type] == undefined) {
						tempContainer.get(message.key.participant).stories = {
							...tempContainer.get(message.key.participant).stories,
							[type]: [message],
						};
						tempContainer.get(message.key.participant).stories[type].push(message);
						continue;
					}

					tempContainer.get(message.key.participant).stories[type].push(message);
				} else {
					tempContainer.set(message.key.participant, {
						index: i,
						stories: {
							[type]: [message],
						},
					});
					i++;
				}
			}

			const data = tempContainer.get(query) || Array.from(tempContainer.values()).find((v) => v.index == Number(query) - 1) || null;

			if (!data) {
				return await client[botNum].reply({ from, quoted: message }, 'Story not found');
			}

			caption += ` • ${data.stories?.extendedTextMessage?.[0].pushName ?? data.stories?.imageMessage?.[0].pushName ?? data.stories?.videoMessage?.[0].pushName}\n`;
			caption += `Texts : ${data.stories?.extendedTextMessage?.length ?? 0}\n`;
			caption += `Images : ${data.stories?.imageMessage?.length ?? 0}\n`;
			caption += `Videos : ${data.stories?.videoMessage?.length ?? 0}\n\n`;
			await client[botNum].reply({ from, quoted: message }, caption.trim());

			for (const type of Object.keys(data.stories)) {
				for (const message of data.stories[type]) {
					const body = message.message?.['extendedTextMessage']?.text ?? message.message?.[type]?.caption ?? 'Caption or texts N/A';

					if (type == 'extendedTextMessage') {
						const buffer = await textStory(body, message.message.extendedTextMessage.backgroundArgb);

						await client[botNum].sendMessage(from, { image: buffer, caption: body }, { quoted: message });
					} else {
						const messages = generateWAMessageFromContent(from, { ...message.message }, {});

						messages.message[type].caption = body;
						messages.message[type].contextInfo = {
							stanzaId: message.key.id,
							participant: message.key.participant,
							quotedMessage: message.message,
							remoteJid: message.key.remoteJid,
						};
						await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
					}
				}
			}
		} catch (err) {
			log(err);
		}
	},
};
