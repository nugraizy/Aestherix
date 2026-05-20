import parser from 'yargs-parser';

import { cmdId } from '../../helper/modules/prefix.js';
import { getWaifu, removeDuplicatesArray } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'waifupic',
	minifiedDescription: 'Random Waifupics',
	description: 'Search images from waifu pics',
	usage:
		'!waifupic `<query>` `--(nsfw/sfw)`\n\nExample : \n!waifupic (oneof `waifu,neko,trap,blowjob`) --nsfw\n!waifupic (oneof `waifu,neko,shinobu,megumin,bully,cuddle,cry,hug,awoo,kiss,lick,pat,smug,bonk,yeet,blush,smile,wave,highfive,handhold,nom,bite,glomp,slap,kill,kick,happy,wink,poke,dance,cringe`) --sfw',
	category: 'Anime',
	aliases: ['wpic'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args, prefix }, client) {
		if (!query) {
			return await client.reply(from, 'You must provide a query.', message);
		}

		if (args[1] === 'next' || args[1] === 'prev') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(5).join(' '))));
			const index = data.findIndex((v) => v === args[4]);

			const builder = new client.TemplateBuilder.Native();

			await builder
				.destination(from)
				.body('Waifu Pics'.formatHeaders())
				.footer(`Provided by waifu.pics\n${index + 1}/${data.length}`)
				.header('Header', data[index])
				.buttons(
					...[
						builder.button.url({
							display: 'Original Source',
							url: data[index]
						}),
						index + 1 !== data.length
							? builder.button.reply({
									display: 'Next Image',
									id: cmdId('waifupic', `next ${args[2]} ${args[3]} ${data[index + 1]} ${JSON.stringify(data)}`, { prefix })
								})
							: builder.button.reply({
									display: `Search More ${args[2].capitalize()}`,
									id: cmdId('waifupic', `${args[2]} -${args[3]}`, { prefix })
								}),
						index !== 0
							? builder.button.reply({
									display: 'Previous Image',
									id: cmdId('waifupic', `prev ${args[2]} ${args[3]} ${data[index - 1]} ${JSON.stringify(data)}`, { prefix })
								})
							: null
					].filter(Boolean)
				)
				.send();

			return;
		}

		let { _: queries, nsfw } = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				nsfw: ['nsfw', 'notsafe'],
				sfw: ['safe', 'sfw']
			}
		});

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await getWaifu(querie.trim(), nsfw ? 'nsfw' : 'sfw');

			if (result?.error) {
				await client.reply(from, result.error, message);
				continue;
			}

			const builder = new client.TemplateBuilder.Native();

			await builder
				.destination(from)
				.body('Waifu Pics'.formatHeaders())
				.footer(`Provided by waifu.pics\n1/${result.length}`)
				.header('Header', result[0])
				.buttons(
					...[
						builder.button.url({
							display: 'Original Source',
							url: result[0]
						}),
						builder.button.reply({
							display: 'Next Image',
							id: cmdId('waifupic', `next ${querie} ${nsfw ? 'nsfw' : 'sfw'} ${result[1]} ${JSON.stringify(result)}`)
						})
					]
				)
				.send();

			return;
		}
	}
});
