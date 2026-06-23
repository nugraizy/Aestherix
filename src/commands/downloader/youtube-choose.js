import { BOT_NAME } from '../../core/constants.js';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
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
	async run({ from, query, message, prefix, device, type, mediaData, sender }, client) {
		const locale = await getLocale(from, sender);
		const L = useLocale(locale, 'common');
		const DL = useLocale(locale, 'downloader');

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
		const body = `${DL.titles.youtubeChoose.formatHeaders()}\n\n${DL.labels.howToDownload}`;

		const builder = new client.TemplateBuilder.Native();

		await builder
			.destination(from)
			.body(body)
			.footer(t(locale, 'common.core.footer.poweredBy', [BOT_NAME]))
			.buttons(
				builder.button.reply({ display: DL.labels.downloadVideo, id: cmdId('ytmp4', query, ctx) }),
				builder.button.reply({ display: DL.labels.downloadAudio, id: cmdId('ytmp3', query, ctx) })
			)
			.send();
	}
});
