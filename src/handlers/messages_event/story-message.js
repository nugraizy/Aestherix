import { generateWAMessageFromContent } from '@adiwajshing/baileys';

import configuration from '../../helper/config/connect.js';
import { runtime } from '../../index.js';
import { textStory } from '../../helper/index.js';
import { color, loggers } from '../../utils/modules/index.js';

let meJid = null;
const SEPERATOR = color('ヽ', '#50FA7B');

/**
 * @param {import('../../types/Socket/index.js').AdvancedClient} client
 * @param {import('../../types/Reconstruct/index.js').ReassignResult} message
 */
const handler = async (client, message) => {
	if (!meJid) {
		meJid = client.instance.decodeJid(instance);
	}

	if (configuration.OPTIONS.autoRead) {
		await client.instance.readMessages([message.message.key]);
	}

	const runtimes = ((Date.now() - runtime) / 1000).toFixed(0);
	let caption = '```Auto Fetch WhatsApp Story```\n\n';
	let messages;

	caption += `Name : ${message.pushname}\n`;
	caption += `Number : ${message.prettyNumber}\n`;
	caption += `Type : ${message.type}\n`;

	if (message.type === 'extendedTextMessage') {
		caption += `Body : ${message.body}`;
		const buffer = await textStory(message.body, message.message.message.extendedTextMessage.backgroundArgb);

		return await client.instance.send(meJid, { image: buffer, caption: caption.trim() });
	} else if (message.type === 'videoMessage' || message.type === 'imageMessage') {
		caption += `Caption : ${message.body}`;
		messages = generateWAMessageFromContent(meJid, { ...JSON.parse(JSON.stringify(message.message.message)) }, {});
		messages.message[message.type].caption = caption;
		messages.message[message.type].contextInfo = {
			stanzaId: message.message.key.id,
			participant: message.message.key.participant,
			quotedMessage: message.message.message,
			remoteJid: message.message.key.remoteJid
		};
		await client.instance.relayMessage(meJid, messages.message, { messageId: messages.key.id });
	}

	loggers.WRN(
		`${color(message.pushname, 'white')} ${SEPERATOR} ${color(message.prettyNumber, '#BD93F9')} ${color(
			'on',
			'#BDE0FE'
		)} ${color(message.from, '#BD93F9')} ${SEPERATOR} ${color(
			message.body === 'Unknown body' ? 'Bug Story' : message.body?.trim()?.replace('\n', '')?.substring(0, 20),
			'white'
		)} ${SEPERATOR} ${color('type', '#BD93F9')} ${SEPERATOR} ${color('Story', 'white')}${color('::', 'white')}${color(
			message.type,
			'white'
		)}`,
		`${color(runtimes, '#f18f15')}${color('s', '#f5e700')}`
	);
};

const storyHandler = handler;

export default storyHandler;
