import fs from 'fs';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { isURL, toMp4, traceMoe } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'tracemoe',
	minifiedDescription: 'Tracemoe Image Search',
	description: 'Reverse image anime search',
	usage: '!tracemoe `<reply image/send image>`',
	category: 'Anime',
	aliases: ['moe', 'waitmoe', 'whatanime'],
	limit: 2,
	cooldown: 2,
	status: 'enable',
	async run(
		{
			type: typeMessage,
			/*cmd,*/
			isMediaImage,
			query,
			extractMediaData,
			filename,
			from,
			message,
			sender,
			args,
			typeQuoted
		},
		client
	) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const La = useLocale(locale, 'anime');

		if (!isURL(query) && !isMediaImage) {
			return await client.reply(from, L.errors.imageRequired, message);
		}

		let media = query && isURL(query) ? query : null;

		if (typeMessage === 'listResponseMessage' && args[1] === 'get') {
			await client.reply(from, L.success.searching, message);

			args = JSON.parse(JSON.parse(JSON.stringify(args.slice(2).join(' '))));

			const {
				anilist: {
					title: { native, romaji },
					type,
					format,
					status,
					startDate: { year: sYear, month: sMonth, day: sDay },
					endDate: { year: eYear, month: eMonth, day: eDay },
					episodes,
					duration,
					source,
					coverImage: { large },
					genres,
					isAdult,
					externalLinks,
					siteUrl,
					studios
				}
			} = args;

			const capt = `\`\`\`${La.labels.trackingInformation}\`\`\`\n
${La.labels.fullTitle} : ${native} (${romaji})
${La.labels.similarity} : ${args.similarity}%
${La.labels.ep} : ${args.episode}
${La.labels.from} : ${String(args.from).toReadAble()}
${La.labels.to} : ${String(args.to).toReadAble()}
    
\`\`\`${La.labels.animeInformation}\`\`\`\n
${La.labels.type} : ${type.toLowerCase().capitalize()} (${format})
${La.labels.source} : ${source.toLowerCase().capitalize()}
${La.labels.status} : ${status.toLowerCase().capitalize()}
${La.labels.totEp} : ${episodes}
${La.labels.epDuration} : ${duration}
${La.labels.startsAiring} : ${sDay} ${sMonth} ${sYear}
${La.labels.endsAiring} : ${eDay} ${eMonth} ${eYear}
${La.labels.genres} : ${genres.join(', ')}
${La.labels.isAdult} : ${isAdult ? t(locale, 'common.labels.yes') : t(locale, 'common.labels.no')}
${La.labels.studios} : ${studios.edges
				.map((v) => {
					return v.node.name;
				})
				.join(', ')}
${
	externalLinks.length !== 0
		? `\n\n${La.labels.extLinks}\n\n${externalLinks
				.map((v) => {
					return `${La.labels.site} : ${v.site}\n${La.labels.url} : ${v.url}\n`;
				})
				.join('\n')}`
		: ''
}`;

			const buffer = await toMp4(args.video, sender);

			return await client.send(
				from,
				{
					video: Buffer.from(buffer, 'base64'),
					caption: `${La.titles.whatAnime.formatHeaders()}\n\n${capt.trim().formatForm()}`,
					templateButtons: [
						{ urlButton: { displayText: La.buttons.imageSource, url: large } },
						{ urlButton: { displayText: La.buttons.videoSource, url: args.video } },
						{ urlButton: { displayText: La.buttons.anilistSource, url: siteUrl } }
					],
					footer: La.buttons.poweredByTraceMoe
				},
				{ quoted: message }
			);
		}

		await client.reply(from, L.success.searching, message);

		if (isMediaImage) {
			media = await client.downloadAndSaveMediaMessage(
				extractMediaData,
				`./tmp/${filename}.${extractMediaData.mimetype.split('/')[1]}`,
				typeQuoted
			);
		}

		const result = await traceMoe(media);

		if (result?.error) {
		if (isMediaImage && extractMediaData) {
				await fs.unlink(media).catch(() => {});
			}

			return await client.reply(from, result.error, message);
		}

		if (isMediaImage) {
			await fs.unlink(media).catch(() => {});
		}

		const {
			anilist: {
				title: { native, romaji },
				type,
				format,
				status,
				startDate: { year: sYear, month: sMonth, day: sDay },
				endDate: { year: eYear, month: eMonth, day: eDay },
				episodes,
				duration,
				source,
				coverImage: { large },
				genres,
				isAdult,
				externalLinks,
				siteUrl,
				studios
			}
		} = result[0];
		const capt = `\`\`\`${La.labels.trackingInformation}\`\`\`\n
${La.labels.fullTitle} : ${native} (${romaji})
${La.labels.similarity} : ${result[0].similarity}%
${La.labels.ep} : ${result[0].episode}
${La.labels.from} : ${String(result[0].from).toReadAble()}
${La.labels.to} : ${String(result[0].to).toReadAble()}

\`\`\`${La.labels.animeInformation}\`\`\`\n
${La.labels.type} : ${type.toLowerCase().capitalize()} (${format})
${La.labels.source} : ${source.toLowerCase().capitalize()}
${La.labels.status} : ${status.toLowerCase().capitalize()}
${La.labels.totEp} : ${episodes}
${La.labels.epDuration} : ${duration}
${La.labels.startsAiring} : ${sDay} ${sMonth} ${sYear}
${La.labels.endsAiring} : ${eDay} ${eMonth} ${eYear}
${La.labels.genres} : ${genres.join(', ')}
${La.labels.isAdult} : ${isAdult ? t(locale, 'common.labels.yes') : t(locale, 'common.labels.no')}
${La.labels.studios} : ${studios.edges
			.map((v) => {
				return v.node.name;
			})
			.join(', ')}

${La.labels.extLinks}

${externalLinks
	.map((v) => {
		return `${La.labels.site} : ${v.site}\n${La.labels.url} : ${v.url}\n`;
	})
	.join('\n')}`;

		const buffer = await toMp4(result[0].video, sender);

		const builder = new client.TemplateBuilder.Native();

		await builder
			.destination(from)
			.footer(La.buttons.poweredByTraceMoe)
			.header('', Buffer.from(buffer, 'base64'))
			.body(`${La.titles.whatAnime.formatHeaders()}\n\n${capt.trim()}`)
			.buttons(
				builder.button.url({ display: La.buttons.imageSource, url: large }),
				builder.button.url({ display: La.buttons.videoSource, url: result[0].video }),
				builder.button.url({ display: La.buttons.anilistSource, url: siteUrl })
			)
			.send();

		// await client.send(
		// 	from,
		// 	{
		// 		video: Buffer.from(buffer, 'base64'),
		// 		caption: `${'What Anime ?'.formatHeaders()}\n\n${capt.trim()}`,
		// 		templateButtons: [
		// 			{ urlButton: { displayText: 'Image Source', url: large } },
		// 			{ urlButton: { displayText: 'Video Source', url: result[0].video } },
		// 			{ urlButton: { displayText: 'Anilist Source', url: siteUrl } }
		// 		],
		// 		footer: 'Powered by trace.moe'
		// 	},
		// 	{ quoted: message }
		// );

		// let i = 0;
		// const row = [];

		// for (const data of result) {
		// 	if (i === 0) {
		// 		i++;
		// 		continue;
		// 	}

		// 	row.push({
		// 		rows: [
		// 			{
		// 				title: `${i}. ${data.media.title.native} (${data.media.title.romaji})`,
		// 				rowId: `${cmd} get ${JSON.stringify(data)}`
		// 			}
		// 		],
		// 		title: `Similarity | ${data.similarity}%`
		// 	});
		// 	i++;
		// }

		// await client.send(
		// 	from,
		// 	{
		// 		title: 'Trace Moe'.formatHeaders(),
		// 		text: 'Trace Moe',
		// 		footer: 'Looking for some more? Choose between these options.',
		// 		buttonText: 'Open List',
		// 		sections: row
		// 	},
		// 	{  }
		// );
	}
});
