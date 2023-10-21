import { imageToAnime } from '../../utils/converter/file-processing.js';
import { color, INFOLOG, ERRLOG } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'toanime',
	description: 'Change your selfie picture to Anime-like using QQ A.I',
	usage: '!toanime <reply media/send media>',
	aliases: ['toanim', 'ai2d', 'faceplay'],
	category: 'Converter',
	cooldown: 8,
	limit: 9,
	status: 'enable',
	run: async ({ isMediaImage, from, prettyNumber, message, mediaData, sender, args, groupMetadata }, client) => {
		INFOLOG(`${color('Converting image to Anime-like', 'cyan')} to ${color(prettyNumber, '#ff71ce')}`);

		let bufferMessage;
		let buffer;

		if (args[1] === '-variant') {
			mediaData = JSON.parse(args.slice(2).join(''));
		}

		if (!isMediaImage && args[1] !== '-variant') {
			return await client[botNum].reply('Please send/reply an image to convert to anime', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		bufferMessage = await client[botNum].downloadMediaMessage(mediaData);
		buffer = await imageToAnime(bufferMessage, sender, {
			crop: 'SINGLE',
			enhance: true,
			proxy: 'socks5://arugaz:arugaz1717%40%23@8.210.154.33:1080',
			onRetry: (e) => ERRLOG(`⚠️ ${color(e.message, '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`)
		});

		buffer = Buffer.from(buffer, 'base64');

		await client[botNum].send(
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
			{ groupMetadata, quoted: message }
		);

		bufferMessage = null;
		buffer = null;

		INFOLOG(`${color('Anime-like image is sent', 'cyan')} to ${color(prettyNumber, '#ff71ce')}`);
	}
};
