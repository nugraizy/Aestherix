/* global botNum */
import { wpDownload, wpLatest, wpSearch } from '../../utils/waifuplay/index.js';

export default {
	name: 'waifuplay',
	description: 'Search Anime or Get Latest Updates from Waifuplay.me.',
	aliases: ['wp'],
	category: 'Anime',
	cooldown: 3,
	usage: '!waifuplay <search/latest> <title>',
	limit: 4,
	status: 'enable',
	async run({ args, from, message, sender, type }, client) {
		switch (true) {
			case /(search|src)/.test(args?.[1]?.trim()):
				{
					let sections;
					const result = await wpSearch(args.slice(2).join(' '));

					if ('error' in result) {
						return await client[botNum].reply({ from, quoted: message }, result.error);
					}

					await client[botNum].sendMessage(
						from,
						{
							image: { url: result.image || 'https://i.stack.imgur.com/6M513.png' },
							caption: `${'Waifuplay Search'.formatHeaders()}\n\n
Title : ${result.title}
Score : ${result.score}
Studio : ${result.studio}
Season : ${result.season}
Type : ${result.type}
Genre : ${result.genre}
Url : ${result.link}`,
						},
						{ quoted: message },
					);

					if (result.listEpisode.type == 'episode') {
						sections = [
							{
								title: result.title,
								rows: result.listEpisode.result.map(({ episode, url }) => {
									return {
										title: `Episode ${episode}`,
										rowId: `.waifuplay download ${url}`,
									};
								}),
							},
						];

						await client[botNum].sendMessage(from, {
							text: '```Choose between these options.```',
							buttonText: 'Open List',
							footer: '\n```Void Bot```',
							mentions: [sender],
							sections,
						});
					} else if (result.listEpisode.type == 'batch') {
						sections = [
							{
								title: 'Waifuplay Downloader'.formatHeaders(),
								rows: result.listEpisode.result.map(({ quality, url }) => {
									return {
										title: quality,
										rowId: `.waifuplay download ${url}`,
									};
								}),
							},
						];

						await client[botNum].sendMessage(from, {
							text: '```Choose between these options.```',
							buttonText: 'Open List',
							footer: '\n```Void Bot```',
							mentions: [sender],
							sections,
						});

						sections = null;
					}
				}

				break;
			case args[1] == 'latest':
				{
					const result = await wpLatest();

					if ('error' in result) {
						return await client[botNum].reply({ from, quoted: message }, result.error);
					}

					for (const { image, title, episode, status, type, link } of result.results) {
						const buttons = [
							{ urlButton: { displayText: 'Source', url: link } },
							{ quickReplyButton: { displayText: 'Download', id: `.waifuplay download ${link}` } },
						];

						await client[botNum].sendMessage(
							from,
							{
								image: { url: image || 'https://i.stack.imgur.com/6M513.png' },
								caption: `${'Waifuplay Latest'.formatHeaders()}
Title : ${title}
Episode : ${episode}
Status : ${status}
Type : ${type}`,
								templateButtons: buttons,
								footer: 'Void Bot',
							},
							{ quoted: message },
						);
					}
				}

				break;
			case args[1] == 'download':
				{
					if (type !== 'listResponseMessage' && type !== 'templateButtonReplyMessage') {
						return await client[botNum].reply({ from, quoted: message }, 'wait, you cannot do that.');
					}

					const result = await wpDownload(args[2]);
					let caption = 'Waifuplay Downloader'.formatHeaders();

					caption += '\n';

					for (const { quality, url } of result) {
						caption += `
• Quality : ${quality}
• URL : ${url}
`;
					}

					await client[botNum].reply({ from, quoted: message }, caption);
				}

				break;
			default:
				await client[botNum].sendMessage(
					from,
					{
						text: `${'Waifuplay Utility'.formatHeaders()}

!waifuplay <search/src> <title>
Ex : .waifuplay search yofukashi no uta

!waifuplay latest

This Utility Provided by waifuplay.my.id
Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
					},
					{ quoted: message },
				);
				break;
		}
	},
};
