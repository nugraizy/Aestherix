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
	],
	_c: ['imageMessage', 'videoMessage'],
	_d: ['stickerMessage', 'audioMessage', 'documentMessage', 'thumbnailMessage', 'contactMessage', 'contactsArrayMessage', 'groupInviteMessage', 'buttonsMessage'],
	_e: ['imageMessage', 'videoMessage', 'stickerMessage', 'documentMessage', 'conversation'],
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
	} else if (type === 'viewOnceMessage' && (m.message.viewOnceMessage.message.imageMessage || m.message.viewOnceMessage.message.videoMessage)) {
		return m.message.viewOnceMessage.message?.imageMessage?.caption || m.message.viewOnceMessage.message?.videoMessage?.caption || 'No Caption';
	} else if (type === 'reactionMessage') {
		return m.message[type].text;
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
	} else if (type === 'viewOnceMessage' && (m.message.viewOnceMessage.message.imageMessage || m.message.viewOnceMessage.message.videoMessage)) {
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
				m.message.extendedTextMessage.contextInfo ? (m.message.extendedTextMessage.contextInfo.quotedMessage ? m.message.extendedTextMessage.contextInfo.quotedMessage : '') : '',
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
