import { imageToAnime } from '../../utils/converter/file-processing.js';
import { color, loggers } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'toanime',
	minifiedDescription: 'Animefy Picture',
	description: 'Change your selfie picture to Anime-like using QQ A.I.',
	usage: '!toanime `<reply media/send media>`',
	aliases: ['toanim', 'ai2d', 'faceplay'],
	category: 'Converter',
	cooldown: 8,
	limit: 9,
	status: 'disable',
	run: async ({ isMediaImage, from, prettyNumber, message, mediaData, sender, args }, client) => {
		loggers.warning(`${color('Converting image to Anime-like', '#FF99C8')} to ${color(prettyNumber, '#E4C1F9')}`);

		let bufferMessage;
		let buffer;

		if (args[1] === '-variant') {
			mediaData = JSON.parse(args.slice(2).join(''));
		}

		if (!isMediaImage && args[1] !== '-variant') {
			return await client.instance.reply(from, 'Please send/reply an image to convert to anime', message);
		}

		bufferMessage = await client.instance.downloadMediaMessage(mediaData);
		buffer = await imageToAnime(bufferMessage, sender, {
			crop: 'SINGLE',
			enhance: true,
			proxy: 'socks5://arugaz:arugaz1717%40%23@8.210.154.33:1080',
			onRetry: (e) => loggers.error(`${color(e.message, '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`)
		});

		buffer = Buffer.from(buffer, 'base64');

		await client.instance.send(
			from,
			{
				image: buffer,
				caption: 'Different of me',
				footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',

				buttons: [
					{
						buttonId: `.ai2d -variant ${JSON.stringify(mediaData)}`,
						buttonText: { displayText: 'Try other variants' },
						type: 1
					}
				],
				headerType: 4
			},
			{ quoted: message }
		);

		bufferMessage = null;
		buffer = null;

		loggers.info(`${color('Anime-like image is sent', '#FF99C8')} to ${color(prettyNumber, '#E4C1F9')}`);
	}
};
