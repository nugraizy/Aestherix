import { SpotifyCover } from '../../helper/canvas/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'spotifycover',
	description: 'Make Spotif Cover',
	category: 'Converter',
	aliases: ['scover'],
	usage: '!spotifycover <query>',
	cooldown: 5,
	limit: 3,
	status: 'enable',
	async run({ from, message, query, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please provide a query', { from, quoted: message, groupMetadata });
		}

		const cover = new SpotifyCover();

		await cover.init(query);

		cover.fillBackground({ gradient: true });

		await cover.putTrackCover({ round: 90, shadow: 80 });
		await cover.putButtons();

		cover.putText().putPlayback();

		client[botNum].send(from, { image: new Buffer.from(cover.toBuffer(), 'base64') }, { groupMetadata, quoted: message });
	}
};
