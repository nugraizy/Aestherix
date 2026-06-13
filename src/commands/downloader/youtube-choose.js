import { BOT_NAME } from '../../core/constants.js';

import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { isURL, isYoutubeURL } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'youtubechoose',
	minifiedDescription: 'Choose YouTube download format',
	description: 'Ask whether to download a YouTube result as video or audio.',
	usage: '!ytchoose `<url>`',
	aliases: ['ytchoose', 'ytc'],
	category: 'Downloader',
	cooldown: 3,
	limit: 8,
	status: 'enable',
	async run({ from, query, message, prefix, device, type, mediaData }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (
			type !== 'buttonsResponseMessage' &&
			!client.decodeJid(await client.resolveJid(mediaData.participant, 'jid'))?.includes(client.decodeJid(client.user.id))
		) {
			return;
		}

		if (!query || !(isURL(query) && isYoutubeURL(query))) {
			return await client.reply(from, L.errors.invalidYoutubeUrl, message);
		}

		const ctx = { prefix, device };
		const body = `${'YouTube Downloader'.formatHeaders()}\n\nHow would you like to download this?`;

		const builder = new client.TemplateBuilder.Native();

		await builder
			.destination(from)
			.body(body)
			.footer('Powered by ' + BOT_NAME)
			.buttons(
				builder.button.reply({ display: '🎬 Download Video', id: cmdId('ytmp4', query, ctx) }),
				builder.button.reply({ display: '🎵 Download Audio', id: cmdId('ytmp3', query, ctx) })
			)
			.send();
	}
});
