import { SpotifyCard } from '../../helper/canvas/index.js';
import { Timer } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
	name: 'spotifycard',
	minifiedDescription: 'Spotify Card',
	description: 'Make Spotif Card',
	category: 'Converter',
	aliases: ['scard'],
	usage: '!spotifycard `<query>`',
	cooldown: 5,
	limit: 3,
	status: 'enable',
	async run({ from, message, query }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		const timer = new Timer('${s}s (${ms} ms)');

		timer.start();

		const wait = await client.waitMessage(from, L.success.loading, message);

		const cover = new SpotifyCard(query, {
			background: {
				// blur: 60
				gradient: true,
				mesh: true
			},
			cover: {
				shadow: 40,
				round: 90
			}
		});

		const { toBuffer } = await cover.render();

		await client.send(from, { image: Buffer.from(toBuffer(), 'base64') }, { quoted: message });

		timer.stop();
		await wait.update('Spotify Card is finished in ' + timer);
	}
});
