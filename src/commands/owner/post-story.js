import { generateMessageID } from '@adiwajshing/baileys';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'upstory',
	description: 'upstory',
	category: 'Owner',
	usage: '!upstory',
	aliases: ['upsw'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run(
		{
			mediaData,
			query,

			isMediaVid,
			isMediaImage,
			isMediaDocument,

			isQuotedSticker,

			from,
			message,
			groupMetadata,

			type,
			typeQuoted,
			bodyQuoted
		},
		client
	) {
		if (!query && !bodyQuoted && !isMediaVid && !isMediaImage && !isMediaDocument && !isQuotedSticker) {
			return client.instance.reply('Please provide a message or media', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		const ownJid = client.instance.decodeJid(instance);
		const jids = await getStoryParticipants(client);

		if (isMediaVid || isMediaImage || isMediaDocument || isQuotedSticker) {
			const media = await client.instance.downloadMediaMessage(mediaData);
			let mime;

			if (isMediaDocument) {
				mime =
					mediaData.message?.documentMessage?.mimetype ||
					mediaData.message?.documentWithCaptionMessage?.message?.documentMessage?.mimetype;

				if (!/video|image/g.test(mime)) {
					return await client.instance.reply('Media type must be video or image', {
						from,
						quoted: message,
						groupMetadata
					});
				}

				mime = mime.split('/')[0];
			}

			const mediaType = clearType(typeQuoted || type, mime);

			return await client.instance.sendMessage(
				'status@broadcast',
				{
					[mediaType]: media,
					caption: query || 'Sent from Aestherix'
				},
				{
					backgroundColor: '#FFFF',
					font: 3,
					statusJidList: jids.concat(ownJid),
					broadcast: true
				}
			);
		}

		return await client.instance.sendMessage(
			'status@broadcast',
			{
				text: query
			},
			{
				backgroundColor: '#FFFF',
				font: 3,
				statusJidList: jids.concat(ownJid),
				broadcast: true
			}
		);
	}
};

const getStoryParticipantsNode = (client) =>
	client.instance.query({
		tag: 'iq',
		attrs: {
			id: generateMessageID(),
			to: '@s.whatsapp.net',
			xmlns: 'status',
			type: 'get'
		},
		content: [
			{
				tag: 'privacy',
				attrs: {},
				content: undefined
			}
		]
	});

const getStoryParticipants = async (client) => {
	const node = await getStoryParticipantsNode(client);
	/* eslint-disable-next-line */
	const mode = node.content[0].content.find((v) => v.attrs?.default === 'true').attrs.type;

	let jids = Object.values(store.localContacts).map((v) => v.id);

	if (mode === 'whitelist') {
		jids = node.content[0].content.find((v) => v.attrs?.type === 'whitelist').content.map((v) => v.attrs?.jid);
	} else if (mode === 'blacklist') {
		const blacklistedContact =
			node.content[0].content.find((v) => v.attrs?.type === 'blacklist').content?.map((v) => v.attrs?.jid) || [];

		if (blacklistedContact.length) {
			jids = jids.filter((v) => !blacklistedContact.includes(v));
		}
	}

	return jids;
};

const clearType = (type, mime = '') => type.replace(/Message|WithCaptionMessage/g, '').replace(/document/g, mime);
