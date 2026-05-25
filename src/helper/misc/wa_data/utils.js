import baileys, { aesDecryptGCM, hmacSign } from 'baileys';

import { S_WHATSAPP_NET } from './constants.js';

const { proto } = baileys;

/**
 * Convert a phone number, JID local-part, or full JID into a WhatsApp user JID.
 * Accepts:
 *   "6281234567890"            → "6281234567890@s.whatsapp.net"
 *   "6281234567890@s.whatsapp.net" → unchanged
 *   "6281234567890@c.us"       → "6281234567890@s.whatsapp.net"
 *   "+62 812-3456-7890"        → "6281234567890@s.whatsapp.net"
 * Returns "" for empty / invalid input.
 * @param {string | number | null | undefined} value
 * @returns {string}
 */
export const toUserJid = (value) => {
	const raw = String(value ?? '').trim();

	if (!raw) {
		return '';
	}

	if (raw.endsWith(S_WHATSAPP_NET)) {
		return raw;
	}

	const digits = raw.split('@')[0].replace(/\D/g, '');

	if (!digits) {
		return '';
	}

	return `${digits}${S_WHATSAPP_NET}`;
};

const MEDIA_TYPE = {
	_a: ['mentionText', 'extendedTextMessage'],
	_b: [
		'stickerMessage',
		'audioMessage',
		'documentMessage',
		'contactMessage',
		'contactsArrayMessage',
		'listMessage',
		'groupInviteMessage',
		'locationMessage',
		'orderMessage',
		'productMessage',
		'templateMessage',
		'pollUpdateMessage'
	],
	_c: ['imageMessage', 'videoMessage', 'documentWithCaptionMessage', 'liveLocationMessage'],
	_d: [
		'stickerMessage',
		'audioMessage',
		'documentMessage',
		'thumbnailMessage',
		'contactMessage',
		'contactsArrayMessage',
		'groupInviteMessage',
		'buttonsMessage'
	],
	_e: ['imageMessage', 'videoMessage', 'stickerMessage', 'documentMessage', 'conversation']
};

/**
 * Extract main body of the WhatsApp message.
 * @param {import('baileys').WAMessage} m
 * @param {keyof import('baileys').proto.IMessage} type
 * @returns {string | 'Unknown Body'}
 */
export const extractBody = (m, type) => {
	if (type === 'conversation') {
		return m.message.conversation;
	} else if (MEDIA_TYPE._a.includes(type)) {
		return m.message.extendedTextMessage.text;
	} else if (MEDIA_TYPE._b.includes(type)) {
		return type.separateCamel().capitalize();
	} else if (type === 'listResponseMessage') {
		return m.message.listResponseMessage.singleSelectReply.selectedRowId;
	} else if (type === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage) {
		return m.message.templateButtonReplyMessage.selectedId;
	} else if (type === 'buttonsMessage') {
		return m.message.buttonsMessage.contentText;
	} else if (type === 'buttonsResponseMessage') {
		return m.message.buttonsResponseMessage.selectedButtonId;
	} else if (MEDIA_TYPE._c.includes(type)) {
		return m.message[type].caption || m.message[type]?.message?.documentMessage?.caption || 'No Caption';
	} else if (
		type === 'viewOnceMessage' &&
		(m.message.viewOnceMessage.message.imageMessage || m.message.viewOnceMessage.message.videoMessage)
	) {
		return (
			m.message.viewOnceMessage.message?.imageMessage?.caption ||
			m.message.viewOnceMessage.message?.videoMessage?.caption ||
			'No Caption'
		);
	} else if (type === 'reactionMessage') {
		return m.message[type].text;
	} else if (type === 'pollCreationMessage') {
		return m.message[type].name;
	} else if (type === 'interactiveResponseMessage') {
		return JSON.parse(m.message[type].nativeFlowResponseMessage.paramsJson)?.id;
	}

	return 'Unknown Body';
};

/**
 * Extract quoted body of WhatsApp message.
 * @param {import('baileys').WAMessage} m
 * @param {keyof import('baileys').proto.IMessage} type
 * @returns {string}
 */
export const extractQuotedBody = (m, type) => {
	if (type === 'conversation') {
		return m.message[type];
	} else if (MEDIA_TYPE._a.includes(type)) {
		return m.message.extendedTextMessage.text;
	} else if (MEDIA_TYPE._c.includes(type)) {
		return m.message[type]?.caption || type.separateCamel().capitalize();
	} else if (MEDIA_TYPE._d.includes(type)) {
		return type.separateCamel().capitalize();
	} else if (type === 'buttonsResponseMessage') {
		return `${m.message[type].contentText}\n${m.message[type].footerText}`;
	} else if (type === 'templateButtonReplyMessage') {
		return m.message[type].selectedId;
	} else if (
		type === 'viewOnceMessage' &&
		(m.message.viewOnceMessage.message.imageMessage || m.message.viewOnceMessage.message.videoMessage)
	) {
		return m.message[type].message?.imageMessage?.caption || m.message[type].message?.videoMessage?.caption || 'No Caption';
	} else if (type === 'templateMessage') {
		return m.message.templateMessage?.hydratedTemplate?.hydratedContentText;
	}

	return '';
};

export const firstKey = (value) => (value && typeof value === 'object' ? Object.keys(value)[0] : null);

/**
 * Find type quoted of the WhatsApp message.
 * @param {import('baileys').WAMessage} m
 * @param {keyof import('baileys').proto.IMessage} type
 * @returns {keyof import('baileys').proto.IMessage}
 */
export const extractTypeQuoted = (m, type) => {
	const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
	const quotedKey = firstKey(quoted);

	return quotedKey || type;
};

/**
 * Extract mentions metadata from WhatsApp message.
 * @param {import('baileys').WAMessage} m
 * @param {(keyof import('baileys').proto.IMessage | 'mentionText')} type
 * @returns {string[]}
 */
export const extractMentionedJid = (m, type) => {
	if (MEDIA_TYPE._a.includes(type)) {
		return m.message[type === 'mentionText' ? 'extendedTextMessage' : type]?.contextInfo?.mentionedJid || [];
	} else if (MEDIA_TYPE._e.includes(type)) {
		return m.message[type]?.contextInfo?.mentionedJid || [];
	}

	return [];
};

/**
 * Extract metadata WhatsApp message.
 * @param {import('baileys').WAMessage} m
 * @param {keyof import('baileys').proto.IMessage} typeM
 * @param {keyof import('baileys').proto.IMessage} typeQ
 * @returns {string[] | null}
 */
export const extractMetadata = (m, typeM, typeQ) => {
	const message = m?.message;
	const dataM = message?.[typeM];
	const dataQ = message?.[typeQ];
	const keyM = firstKey(dataM?.message);
	const keyQ = firstKey(dataQ?.message);

	return (keyM ? dataM?.message?.[keyM] : null) || dataM || (keyQ ? dataQ?.message?.[keyQ] : null) || dataQ || null;
};

/**
 * @param {string} str
 * @returns
 */
const toBinary = (str) => Buffer.from(str);

/**
 * Decrypt PollUpdate messages
 */
export class PollUpdateDecrypt {
	/**
	 * decrypt a poll message update
	 * @param encPayload from the update
	 * @param encIv from the update
	 * @param encKey from the original poll
	 * @param pollMsgSender sender jid of the pollCreation message
	 * @param pollMsgId id of the pollCreation message
	 * @param voteMsgSender sender of the pollUpdate message
	 * @returns The option or empty array if something went wrong OR everything was unticked
	 */
	static async decrypt(encPayload, encIv, pollCreatorJid, pollMsgId, pollEncKey, voterJid) {
		const sign = Buffer.concat([
			toBinary(pollMsgId),
			toBinary(pollCreatorJid),
			toBinary(voterJid),
			toBinary('Poll Vote'),
			new Uint8Array([1])
		]);

		const key0 = hmacSign(pollEncKey, new Uint8Array(32), 'sha256');
		const decKey = hmacSign(sign, key0, 'sha256');
		const aad = toBinary(`${pollMsgId}\u0000${voterJid}`);

		const decrypted = aesDecryptGCM(encPayload, decKey, encIv, aad);

		return proto.Message.PollVoteMessage.decode(decrypted);
	}
}
