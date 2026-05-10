import { SpotifyCard } from '../../helper/canvas/index.js';
import { Timer } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!query) {
			return await client.instance.reply(from, 'Please provide a query', message);
		}

		const timer = new Timer('${s}s (${ms} ms)');

		timer.start();

		const wait = await client.instance.waitMessage(from, 'Please wait...', message);

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

		await client.instance.send(from, { image: new Buffer.from(toBuffer(), 'base64') }, { quoted: message });

		timer.stop();
		await wait.update('Spotify Card is finished in ' + timer);
	}
};
