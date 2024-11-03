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

			type,
			typeQuoted,
			bodyQuoted
		},
		client
	) {
		if (!query && !bodyQuoted && !isMediaVid && !isMediaImage && !isMediaDocument && !isQuotedSticker) {
			return client.instance.reply('Please provide a message or media', {
				from,
				quoted: message
			});
		}

		const ownJid = client.instance.decodeJid(instance);
		const jids = await client.instance.getStoryParticipants(client);

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
						quoted: message
					});
				}

				mime = mime.split('/')[0];
			}

			if (isQuotedSticker) {
				mime = mediaData.message?.stickerMessage?.isAnimated ? 'video' : 'image';
			}

			const mediaType = client.instance.clearType(typeQuoted || type, mime);

			return await client.instance.send(
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

		return await client.instance.send(
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
