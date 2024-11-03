import path from 'path';

import { color, loggers } from '../../utils/modules/index.js';
import { soundRemover } from '../../utils/converter/index.js';
import { extension, audioFormat, videoFormat } from '../../utils/misc/mimetype.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'soundremover',
	minifiedDescription: 'Remove Voice',
	description: 'Remove specific sound from audio/video',
	category: 'Converter',
	usage: '!soundremover <Audio/Video(reply/send)>',
	aliases: ['soundremove', 'soundrem', 'soundremoveaudio', 'soundremovevideo', 'soundremoveaudiovideo', 'vrm', 'srm'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run(
		{
			isQuotedAudio,
			isQuotedDocument,
			isMediaVid,
			from,
			prettyNumber,
			message,
			filename,
			query,
			extractMediaData,
			typeQuoted
		},
		client
	) {
		if (!isQuotedAudio && !isQuotedDocument && !isMediaVid) {
			return await client.instance.reply('Please send/reply an audio/video to remove voice', {
				from,
				quoted: message
			});
		}

		loggers.warning(`${color('Removing Sound', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		const file = await client.instance.downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted
		);

		if (
			isQuotedDocument &&
			!audioFormat.includes(extractMediaData.mimetype) &&
			!videoFormat.includes(extractMediaData.mimetype)
		) {
			return await client.instance.reply('This file is not an audio/video', { from, quoted: message });
		}

		const { result } = await soundRemover(file, prettyNumber);

		if (/--?(voice|suara)/.test(query) && /--?(instrument(s)?)/.test(query)) {
			return await client.instance.reply(`${result.vocal}\n${result.instrumental}`, {
				from,
				quoted: message
			});
		} else if (/--?(voice|suara)/.test(query)) {
			await client.instance.send(
				from,
				{
					document: { url: result.instrumental },
					fileName: extractMediaData?.fileName?.replace(extension(extractMediaData.mimetype), 'mp3') ?? 'Made by Nanda.mp3',
					mimetype: 'audio/mp3'
				},
				{ quoted: message }
			);
		} else if (/--?(instrumen(ts)?)/.test(query)) {
			await client.instance.send(
				from,
				{
					document: { url: result.vocal },
					fileName: extractMediaData?.fileName?.replace(extension(extractMediaData.mimetype), 'mp3') ?? 'Made by Nanda.mp3',
					mimetype: 'audio/mp3'
				},
				{ quoted: message }
			);
		} else {
			await client.instance.send(
				from,
				{
					document: { url: result.instrumental },
					fileName: extractMediaData.fileName ?? 'Made by Nanda.mp3',
					mimetype: 'audio/mp3'
				},
				{ quoted: message }
			);
		}

		loggers.info(`${color('Sound is sent', '#FF99C8')} to ${color(prettyNumber, '#E4C1F9')}`);
	}
};
