
import { color, loggers } from '../../utils/modules/index.js';
import { soundRemover } from '../../utils/converter/index.js';
import { extension, audioFormat, videoFormat } from '../../utils/misc/mimetype.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
	name: 'soundremover',
	minifiedDescription: 'Remove Voice',
	description: 'Remove specific sound from audio/video',
	category: 'Converter',
	usage: '!soundremover <reply/send audio/video>',
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if ((!isQuotedAudio && !isQuotedDocument && !isMediaVid) || !extractMediaData) {
			return await client.reply(from, L.errors.audioVideoRequired, message);
		}

		loggers.warning(`${color('Removing Sound', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		const file = await client.downloadAndSaveMediaMessage(
			extractMediaData,
			`./tmp/${filename}.${extractMediaData.mimetype.split('/')[1]}`,
			typeQuoted
		);

		if (
			isQuotedDocument &&
			!audioFormat.includes(extractMediaData.mimetype) &&
			!videoFormat.includes(extractMediaData.mimetype)
		) {
			return await client.reply(from, L.errors.audioVideoRequired, message);
		}

		const { result } = await soundRemover(file, prettyNumber);

		if (/--?(voice|suara)/.test(query) && /--?(instrument(s)?)/.test(query)) {
			return await client.reply(from, `${result.vocal}\n${result.instrumental}`, message);
		} else if (/--?(voice|suara)/.test(query)) {
			await client.send(
				from,
				{
					document: { url: result.instrumental },
					fileName: extractMediaData?.fileName?.replace(extension(extractMediaData.mimetype), 'mp3') ?? 'Made by Nanda.mp3',
					mimetype: 'audio/mp3'
				},
				{ quoted: message }
			);
		} else if (/--?(instrumen(ts)?)/.test(query)) {
			await client.send(
				from,
				{
					document: { url: result.vocal },
					fileName: extractMediaData?.fileName?.replace(extension(extractMediaData.mimetype), 'mp3') ?? 'Made by Nanda.mp3',
					mimetype: 'audio/mp3'
				},
				{ quoted: message }
			);
		} else {
			await client.send(
				from,
				{
					document: { url: result.instrumental },
					fileName: extractMediaData.fileName ?? 'Made by Nanda.mp3',
					mimetype: 'audio/mp3'
				},
				{ quoted: message }
			);
		}

		loggers.info(`${color('Sound is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
	}
});
