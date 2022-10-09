/* global botNum */
import fs from 'fs';
import path from 'path';

import { __dirname } from '../../index.js';
import { isURL } from '../../helper/index.js';
import { toMp4 } from '../../utils/converter/index.js';
import { traceMoe } from '../../utils/image_reverse_search/index.js';

export default {
	name: 'tracemoe',
	description: 'Reverse image anime search',
	usage: '!tracemoe <reply image/send image>',
	category: 'Anime',
	aliases: ['moe', 'waitmoe', 'whatanime'],
	limit: 2,
	cooldown: 2,
	status: 'enable',
	async run({ type: typeMessage, cmd, isMediaImage, query, extractMediaData, filename, from, message, sender, args, typeQuoted }, client) {
		if (!isURL(query) && !isMediaImage) {
			return await client[botNum].reply({ from, quoted: message }, 'Please send/reply a image to find the similar image');
		}

		let media = query && isURL(query) ? query : null;

		if (typeMessage == 'listResponseMessage' && args[1] == 'get') {
			await client[botNum].reply({ from, quoted: message }, 'Searching. Please wait...');

			args = JSON.parse(JSON.parse(JSON.stringify(args.slice(2).join(' '))));

			const {
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
			} = args.media;

			const capt = `\`\`\`• Tracking Information\`\`\`\n
Title : ${native} (${romaji})
Similarity : ${args.similarity}%
Ep : ${args.episode}
from : ${String(args.from).toReadAble()}
To : ${String(args.to).toReadAble()}
    
\`\`\`• Anime Information\`\`\`\n
Type : ${type.toLowerCase().capitalize()} (${format})
Source : ${source.toLowerCase().capitalize()}
Status : ${status.toLowerCase().capitalize()}
Tot. Ep : ${episodes}
Ep Duration : ${duration}
Starts Airing : ${sDay} ${sMonth} ${sYear}
Ends Airing : ${eDay} ${eMonth} ${eYear}
Genres : ${genres.join(', ')}
+18? : ${isAdult ? 'Yes' : 'No'}
Studios : ${args.media.studios.edges
				.map((v) => {
					return v.node.name;
				})
				.join(', ')}
${
	externalLinks.length !== 0
		? `\n\nExt Links : \n\n${externalLinks
				.map((v) => {
					return `Site: ${v.site}\nURL : ${v.url}\n`;
				})
				.join('\n')}`
		: ''
}`;

			const buffer = await toMp4(args.video, sender);

			return await client[botNum].sendMessage(
				from,
				{
					video: new Buffer.from(buffer, 'base64'),
					caption: `\`\`\` • What Anime ?\`\`\`\n\n${capt.trim()}`,
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: large } },
						{ urlButton: { displayText: 'Video Source', url: args.video } },
						{ urlButton: { displayText: 'Anilist Source', url: siteUrl } },
					],
					footer: 'Powered by trace.moe',
				},
				{ quoted: message },
			);
		}

		await client[botNum].reply({ from, quoted: message }, 'Searching. Please wait...');

		if (isMediaImage) {
			media = await client[botNum].downloadAndSaveMediaMessage(
				extractMediaData,
				path.join(__dirname, `temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
				typeQuoted,
			);
		}

		const result = await traceMoe(media);

		if ('error' in result) {
			if (isMediaImage) {
				fs.unlinkSync(media);
			}

			return await client[botNum].reply({ from, quoted: message }, result.error);
		}

		if (isMediaImage) {
			fs.unlinkSync(media);
		}

		const {
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
		} = result[0].media;
		const capt = `\`\`\`• Tracking Information\`\`\`\n
Title : ${native} (${romaji})
Similarity : ${result[0].similarity}%
Ep : ${result[0].episode}
from : ${String(result[0].from).toReadAble()}
To : ${String(result[0].to).toReadAble()}

\`\`\`• Anime Information\`\`\`\n
Type : ${type.toLowerCase().capitalize()} (${format})
Source : ${source.toLowerCase().capitalize()}
Status : ${status.toLowerCase().capitalize()}
Tot. Ep : ${episodes}
Ep Duration : ${duration}
Starts Airing : ${sDay} ${sMonth} ${sYear}
Ends Airing : ${eDay} ${eMonth} ${eYear}
Genres : ${genres.join(', ')}
+18? : ${isAdult ? 'Yes' : 'No'}
Studios : ${result[0].media.studios.edges
			.map((v) => {
				return v.node.name;
			})
			.join(', ')}

Ext Links :

${externalLinks
	.map((v) => {
		return `Site: ${v.site}\nURL : ${v.url}\n`;
	})
	.join('\n')}`;

		const buffer = await toMp4(result[0].video, sender);

		await client[botNum].sendMessage(
			from,
			{
				video: new Buffer.from(buffer, 'base64'),
				caption: `\`\`\` • What Anime ?\`\`\`\n\n${capt.trim()}`,
				templateButtons: [
					{ urlButton: { displayText: 'Image Source', url: large } },
					{ urlButton: { displayText: 'Video Source', url: result[0].video } },
					{ urlButton: { displayText: 'Anilist Source', url: siteUrl } },
				],
				footer: 'Powered by trace.moe',
			},
			{ quoted: message },
		);

		let i = 0;
		const row = [];

		for (const data of result) {
			if (i == 0) {
				i++;
				continue;
			}

			row.push({
				rows: [
					{
						title: `${i}. ${data.media.title.native} (${data.media.title.romaji})`,
						rowId: `${cmd} get ${JSON.stringify(data)}`,
					},
				],
				title: `Similarity | ${data.similarity}%`,
			});
			i++;
		}

		await client[botNum].sendMessage(from, {
			title: '``` • Trace Moe```',
			text: 'Trace Moe',
			footer: 'Looking for some more? Choose between these options.',
			buttonText: 'Open List',
			sections: row,
		});
	},
};
