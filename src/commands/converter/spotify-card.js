import { SpotifyCard } from '../../helper/canvas/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'spotifycard',
	minifiedDescription: 'Spotify Card',
	description: 'Make Spotif Card',
	category: 'Converter',
	aliases: ['scard'],
	usage: '!spotifycard <query>',
	cooldown: 5,
	limit: 3,
	status: 'enable',
	async run({ from, message, query }, client) {
		if (!query) {
			return await client.instance.reply('Please provide a query', { from, quoted: message });
		}

		const cover = new SpotifyCard(query, {
			background: {
				blur: 60
			},
			cover: {
				shadow: 40,
				round: 90
			}
		});

		const { toBuffer } = await cover.render();

		client.instance.send(from, { image: new Buffer.from(toBuffer(), 'base64') }, { quoted: message });
	}
};
