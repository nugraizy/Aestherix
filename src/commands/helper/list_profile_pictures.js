import configuration from '../../helper/config/connect.js';

const getTotalPictures = (pictures) => pictures.values().values.reduce((acc, curr) => acc + curr.length, 0);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'listpp',
	minifiedDescription: 'List Profile Pictures',
	description: 'List every pictures of the profile, started from the project startup.',
	usage: '!listpp',
	aliases: ['lspp'],
	category: 'Helper',
	cooldown: 10,
	limit: 2,
	status: 'enable',
	async run({ from, message }, client) {
		const pictures = configuration.pinterestImages;

		if (!pictures.size) {
			return client.instance.send(from, { text: 'No profile pictures have been saved yet.' }, { quoted: message });
		}

		let caption = `📌 Total saved sequences: ${pictures.size}\n\n`;

		for (const [date, images] of pictures.entries()) {
			caption += `${date} : ${images}`;
			caption += '\n\n';
		}

		client.instance.send(from, { text: caption.trim() }, { quoted: message });
	}
};
