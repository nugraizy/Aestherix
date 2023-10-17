import path from 'path';

import { color, INFOLOG } from '../../utils/modules/index.js';
import { soundRemover } from '../../utils/converter/index.js';
import { extension, audioFormat, videoFormat } from '../../utils/misc/mimetype.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'soundremover',
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
			typeQuoted,
			groupMetadata
		},
		client
	) {
		if (!isQuotedAudio && !isQuotedDocument && !isMediaVid) {
			return await client[botNum].reply('Please send/reply an audio/video to remove voice', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		INFOLOG(`${color('Removing Sound', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

		const file = await client[botNum].downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted
		);

		if (
			isQuotedDocument &&
			!audioFormat.includes(extractMediaData.mimetype) &&
			!videoFormat.includes(extractMediaData.mimetype)
		) {
			return await client[botNum].reply('This file is not an audio/video', { from, quoted: message, groupMetadata });
		}

		const { result } = await soundRemover(file, prettyNumber);

		if (/--?(voice|suara)/.test(query) && /--?(instrument(s)?)/.test(query)) {
			return await client[botNum].reply(`${result.vocal}\n${result.instrumental}`, {
				from,
				quoted: message,
				groupMetadata
			});
		} else if (/--?(voice|suara)/.test(query)) {
			await client[botNum].send(
				from,
				{
					document: { url: result.instrumental },
					fileName: extractMediaData?.fileName?.replace(extension(extractMediaData.mimetype), 'mp3') ?? 'Made by Nanda.mp3',
					mimetype: 'audio/mp3'
				},
				{ groupMetadata, quoted: message }
			);
		} else if (/--?(instrumen(ts)?)/.test(query)) {
			await client[botNum].send(
				from,
				{
					document: { url: result.vocal },
					fileName: extractMediaData?.fileName?.replace(extension(extractMediaData.mimetype), 'mp3') ?? 'Made by Nanda.mp3',
					mimetype: 'audio/mp3'
				},
				{ groupMetadata, quoted: message }
			);
		} else {
			await client[botNum].send(
				from,
				{
					document: { url: result.instrumental },
					fileName: extractMediaData.fileName ?? 'Made by Nanda.mp3',
					mimetype: 'audio/mp3'
				},
				{ groupMetadata, quoted: message }
			);
		}

		INFOLOG(`${color('Sound is sent', 'cyan')} to ${color(prettyNumber, '#ff71ce')}`);
	}
};
