import { SpotifyCover } from '../../helper/canvas/index.js';

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
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please provide a query');
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
