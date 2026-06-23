import { BOT_NAME } from '../../core/constants.js';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Lo = useLocale(locale, 'owner');

		if (!query && !bodyQuoted && !isMediaVid && !isMediaImage && !isMediaDocument && !isQuotedSticker) {
			return client.reply(from, L.errors.messageRequired, message);
		}

		const ownJid = client.decodeJid(client.user.id);
		const jids = await client.getStoryParticipants(client);

		if (isMediaVid || isMediaImage || isMediaDocument || isQuotedSticker) {
			const media = await client.downloadMediaMessage(mediaData);
			let mime;

			if (isMediaDocument) {
				mime =
					mediaData.message?.documentMessage?.mimetype ||
					mediaData.message?.documentWithCaptionMessage?.message?.documentMessage?.mimetype;

				if (!/video|image/g.test(mime)) {
					return await client.reply(from, L.simulate.mediaTypeInvalid, message);
				}

				mime = mime.split('/')[0];
			}

			if (isQuotedSticker) {
				mime = mediaData.message?.stickerMessage?.isAnimated ? 'video' : 'image';
			}

			const mediaType = client.clearType(typeQuoted || type, mime);

			return await client.send(
				'status@broadcast',
				{
					[mediaType]: media,
					caption: query || t(locale, 'owner.labels.sentFrom', [BOT_NAME])
				},
				{
					backgroundColor: '#FFFF',
					font: 3,
					statusJidList: jids.concat(ownJid),
					broadcast: true
				}
			);
		}

		return await client.send(
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
});
