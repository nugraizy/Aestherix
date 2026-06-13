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
	textBased: ['mentionText', 'extendedTextMessage'],
	labelOnly: [
		'stickerMessage',
		'lottieStickerMessage',
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
	captioned: ['imageMessage', 'videoMessage', 'documentWithCaptionMessage', 'liveLocationMessage'],
	quotedLabelOnly: [
		'stickerMessage',
		'lottieStickerMessage',
		'audioMessage',
		'documentMessage',
		'thumbnailMessage',
		'contactMessage',
		'contactsArrayMessage',
		'groupInviteMessage',
		'buttonsMessage'
	],
	mentionable: ['imageMessage', 'videoMessage', 'stickerMessage', 'documentMessage', 'conversation']
};

/**
 * Extract main body of the WhatsApp message.
 * @param {import('baileys').WAMessage} m
 * @param {keyof import('baileys').proto.IMessage} type
 * @returns {string | 'Unknown Body'}
 */
export const extractBody = (m, type) => {
	const msg = m.message;

	if (type === 'conversation') {
		return msg.conversation;
	}

	if (MEDIA_TYPE.textBased.includes(type)) {
		return msg.extendedTextMessage.text;
	}

	if (MEDIA_TYPE.labelOnly.includes(type)) {
		return type.separateCamel().capitalize();
	}

	if (type === 'listResponseMessage') {
		return msg.listResponseMessage.singleSelectReply.selectedRowId;
	}

	if (type === 'templateButtonReplyMessage') {
		return msg.templateButtonReplyMessage?.selectedId;
	}

	if (type === 'buttonsMessage') {
		return msg.buttonsMessage.contentText;
	}

	if (type === 'buttonsResponseMessage') {
		return msg.buttonsResponseMessage.selectedButtonId;
	}

	if (type === 'reactionMessage') {
		return msg[type].text;
	}

	if (type === 'pollCreationMessage') {
		return msg[type].name;
	}

	if (MEDIA_TYPE.captioned.includes(type)) {
		return msg[type].caption || msg[type]?.message?.documentMessage?.caption || 'No Caption';
	}

	if (type === 'viewOnceMessage') {
		const inner = msg.viewOnceMessage.message;

		return inner?.imageMessage?.caption || inner?.videoMessage?.caption || 'No Caption';
	}

	if (type === 'interactiveResponseMessage') {
		try {
			return JSON.parse(msg[type].nativeFlowResponseMessage.paramsJson)?.id;
		} catch {
			return 'Unknown Body';
		}
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
	const msg = m.message;

	if (type === 'conversation') {
		return msg[type];
	}

	if (MEDIA_TYPE.textBased.includes(type)) {
		return msg.extendedTextMessage.text;
	}

	if (MEDIA_TYPE.captioned.includes(type)) {
		return msg[type]?.caption || type.separateCamel().capitalize();
	}

	if (MEDIA_TYPE.quotedLabelOnly.includes(type)) {
		return type.separateCamel().capitalize();
	}

	if (type === 'buttonsResponseMessage') {
		return `${msg[type].contentText}\n${msg[type].footerText}`;
	}

	if (type === 'templateButtonReplyMessage') {
		return msg[type].selectedId;
	}

	if (type === 'templateMessage') {
		return msg.templateMessage?.hydratedTemplate?.hydratedContentText;
	}

	if (type === 'viewOnceMessage') {
		const inner = msg.viewOnceMessage.message;

		return inner?.imageMessage?.caption || inner?.videoMessage?.caption || 'No Caption';
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
export const extractTypeQuoted = (m) => {
	const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
	const quotedKey = firstKey(quoted);

	return quotedKey;
};

/**
 * Extract mentions metadata from WhatsApp message.
 * @param {import('baileys').WAMessage} m
 * @param {(keyof import('baileys').proto.IMessage | 'mentionText')} type
 * @returns {string[]}
 */
export const extractMentionedJid = (m, type) => {
	if (MEDIA_TYPE.textBased.includes(type)) {
		const key = type === 'mentionText' ? 'extendedTextMessage' : type;

		return m.message[key]?.contextInfo?.mentionedJid || [];
	}

	if (MEDIA_TYPE.mentionable.includes(type)) {
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
