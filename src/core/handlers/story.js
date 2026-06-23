import { generateWAMessageFromContent } from 'baileys';

import configuration from '../../helper/config/connect.js';
import { TextStory } from '../../helper/canvas/index.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { runtime } from '../runtime.js';
import { color, loggers } from '../../utils/modules/index.js';

let meJid = null;
const SEPERATOR = color('ヽ', 'green');

/**
 * @param {import('../../types/Socket/index.js').AdvancedClient} client
 * @param {import('../../types/Reconstruct/index.js').ReassignResult} message
 */
const handler = async (client, message) => {
	if (!meJid) {
		meJid = client.decodeJid(client.user.id);
	}

	if (configuration.flags.autoRead) {
		await client.readMessages([message.message.key]);
	}

	const locale = await getLocale(message.from);
	const L = useLocale(locale, 'common');
	const runtimes = ((Date.now() - runtime) / 1000).toFixed(0);
	let caption = `\`\`\`${L.core.story.autoFetch}\`\`\`\n\n`;
	let messages;

	caption += `${L.core.story.name}${message.pushname}\n`;
	caption += `${L.core.story.number}${message.prettyNumber}\n`;
	caption += `${L.core.story.type}${message.type}\n`;

	if (message.type === 'extendedTextMessage') {
		caption += `${L.core.story.body}${message.body}`;
		const story = new TextStory();
		const buffer = await story.render(message.body, message.message.message.extendedTextMessage.backgroundArgb);

		return await client.send(meJid, { image: buffer, caption: caption.trim() });
	} else if (message.type === 'videoMessage' || message.type === 'imageMessage') {
		caption += `${L.core.story.caption}${message.body}`;
		messages = generateWAMessageFromContent(
			meJid,
			{ ...JSON.parse(JSON.stringify(message.message.message)) },
			{ messageId: client.generateMessageID() }
		);
		messages.message[message.type].caption = caption;
		messages.message[message.type].contextInfo = {
			stanzaId: message.message.key.id,
			participant: message.message.key.participant,
			quotedMessage: message.message.message,
			remoteJid: message.message.key.remoteJid
		};
		await client.relay(meJid, messages.message, { messageId: messages.key.id });
	}

	loggers.warning(
		`${color(message.pushname, 'white')} ${SEPERATOR} ${color(message.prettyNumber, 'purple')} ${color(
			'on',
			'powderBlue'
		)} ${color(message.from, 'purple')} ${SEPERATOR} ${color(
			message.body === 'Unknown body' ? 'Bug Story' : message.body?.trim()?.replace('\n', '')?.substring(0, 20),
			'white'
		)} ${SEPERATOR} ${color('type', 'purple')} ${SEPERATOR} ${color('Story', 'white')}${color('::', 'white')}${color(
			message.type,
			'white'
		)}`,
		`${color(runtimes, 'amber')}${color('s', 'lemon')}`
	);
};

const storyHandler = handler;

export default storyHandler;
