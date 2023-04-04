const MEDIA_TYPE = {
	_a: ['mentionText', 'extendedTextMessage'],
	_b: [
		'stickerMessage',
		'audioMessage',
		'documentMessage',
		'contactMessage',
		'contactsArrayMessage',
		'listMessage',
		'liveLocationMessage',
		'groupInviteMessage',
		'locationMessage',
		'orderMessage',
		'productMessage',
		'templateMessage',
		'pollUpdateMessage'
	],
	_c: ['imageMessage', 'videoMessage'],
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
 * @param {{message: any}} m
 * @param {string} type
 * @returns {string}
 */
export const extractBody = (m, type) => {
	if (type === 'conversation') {
		return m.message.conversation;
	} else if (MEDIA_TYPE._a.includes(type)) {
		return m.message.extendedTextMessage.text;
	} else if (MEDIA_TYPE._b.includes(type)) {
		return type.seperateCamel().capitalize();
	} else if (type === 'listResponseMessage') {
		return m.message.listResponseMessage.singleSelectReply.selectedRowId;
	} else if (type === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage) {
		return m.message.templateButtonReplyMessage.selectedId;
	} else if (type === 'buttonsMessage') {
		return m.message.buttonsMessage.contentText;
	} else if (type === 'buttonsResponseMessage') {
		return m.message.buttonsResponseMessage.selectedButtonId;
	} else if (MEDIA_TYPE._c.includes(type)) {
		return m.message[type].caption || 'No Caption';
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
	}

	return 'Unknown Body';
};

/**
 * Extract quoted body of WhatsApp message.
 * @param {{message: any}} m
 * @param {string} type
 * @returns {string}
 */
export const extractQuotedBody = (m, type) => {
	if (type === 'conversation') {
		return m.message[type];
	} else if (MEDIA_TYPE._a.includes(type)) {
		return m.message.extendedTextMessage.text;
	} else if (MEDIA_TYPE._c.includes(type)) {
		return m.message[type]?.caption || type.seperateCamel().capitalize();
	} else if (MEDIA_TYPE._d.includes(type)) {
		return type.seperateCamel().capitalize();
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

/**
 * Find type quoted of the WhatsApp message.
 * @param {{message: any}} m
 * @param {string} type
 * @returns {string}
 */
export const extractTypeQuoted = (m, type) =>
	m.message?.extendedTextMessage
		? Object.keys(
				m.message.extendedTextMessage.contextInfo
					? m.message.extendedTextMessage.contextInfo.quotedMessage
						? m.message.extendedTextMessage.contextInfo.quotedMessage
						: ''
					: ''
		  )[0] /* eslint-disable-line*/
		: type;

/**
 * Extract mentions metadata from WhatsApp message.
 * @param {{message: any}} m
 * @param {string} type
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
 * @param {{message: any}} m
 * @param {string} type
 * @returns {string[]}
 */
export const extractMetadata = (m, typeM, typeQ) => {
	return (
		m.message?.[typeM]?.message?.[Object.keys(m.message[typeM].message)[0]] ||
		m.message?.[typeM] ||
		m.message?.[typeQ]?.message?.[Object.keys(m.message[typeQ].message)[0]] ||
		m.message?.[typeQ] ||
		{}
	);
};

import crypto from 'node:crypto';

const enc = new TextEncoder();

/**
 * Decrypt PollUpdate messages
 */
export class PollUpdateDecrypt {
	/**
	 * Compare the SHA-256 hashes of the poll options from the update to find the original choices
	 * @param options Options from the poll creation message
	 * @param pollOptionHash hash from `this.decrypt()`
	 * @returns the original option, can be empty when none are currently selected
	 */
	static async compare(options, pollOptionHashes) {
		const selectedOptions = [];

		for (let option of options) {
			const hash = Buffer.from(await crypto.webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(option)))
				.toString('hex')
				.toUpperCase();

			for (const pollOptionHash of pollOptionHashes) {
				if (pollOptionHash === hash) {
					selectedOptions.push(option);
				}
			}
		}

		return selectedOptions;
	}

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
	static async decrypt(encKey, encPayload, encIv, pollMsgSender, pollMsgId, voteMsgSender) {
		const stanzaId = enc.encode(pollMsgId);
		const parentMsgOriginalSender = enc.encode(pollMsgSender);
		const modificationSender = enc.encode(voteMsgSender);
		const modificationType = enc.encode('Poll Vote');
		const pad = new Uint8Array([1]);

		const signMe = new Uint8Array([...stanzaId, ...parentMsgOriginalSender, ...modificationSender, ...modificationType, pad]);

		const createSignKey = async (n = new Uint8Array(32)) => {
			return await crypto.webcrypto.subtle.importKey('raw', n, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
		};

		const sign = async (n, key) => {
			return await crypto.webcrypto.subtle.sign({ name: 'HMAC', hash: 'SHA-256' }, key, n);
		};

		let key = await createSignKey();

		const temp = await sign(encKey, key);

		key = await createSignKey(new Uint8Array(temp));

		const decryptionKey = new Uint8Array(await sign(signMe, key));

		const additionalData = enc.encode(`${pollMsgId}\u0000${voteMsgSender}`);

		const decryptedMessage = await this._decryptMessage(encPayload, encIv, additionalData, decryptionKey);

		const pollOptionHash = this._decodeMessage(decryptedMessage);

		// '0A20' in hex represents unicode " " and "\n" thus declaring the end of one option
		// we want multiple hashes to make it easier to iterate and understand for your use cases
		return pollOptionHash.split('0A20') || [];
	}

	/**
	 * Internal method to decrypt the message after gathering all information
	 * @deprecated Use `this.decrypt()` instead, only use this if you know what you are doing
	 * @param encPayload
	 * @param encIv
	 * @param additionalData
	 * @param decryptionKey
	 * @returns
	 */
	static async _decryptMessage(encPayload, encIv, additionalData, decryptionKey) {
		const tagSizeMultiplier = 16;
		const encoded = encPayload;
		const key = await crypto.webcrypto.subtle.importKey('raw', decryptionKey, 'AES-GCM', false, ['encrypt', 'decrypt']);
		const decrypted = await crypto.webcrypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: encIv, additionalData: additionalData, tagLength: 8 * tagSizeMultiplier },
			key,
			encoded
		);

		return new Uint8Array(decrypted).slice(2); // remove 2 bytes (OA20)(space+newline)
	}

	/**
	 * Decode the message from `this._decryptMessage()`
	 * @param decryptedMessage the message from `this._decrpytMessage()`
	 * @returns
	 */
	static _decodeMessage(decryptedMessage) {
		const n = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70];
		const outarr = [];

		for (let i = 0; i < decryptedMessage.length; i++) {
			const val = decryptedMessage[i];

			outarr.push(n[val >> 4], n[15 & val]);
		}

		return String.fromCharCode(...outarr);
	}
}
