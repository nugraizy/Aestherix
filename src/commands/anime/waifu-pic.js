import parser from 'yargs-parser';

import { getWaifu, removeDuplicatesArray } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
	async run({ query, from, message, args }, client) {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a query.', message);
		}

		if (args[1] === 'next' || args[1] === 'prev') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(5).join(' '))));
			const index = data.findIndex((v) => v === args[4]);

			const builder = new client.instance.TemplateBuilder.Native(client);

			builder
				.mainBody('Waifu Pics'.formatHeaders())
				.mainFooter(`Provided by waifu.pics\n${index + 1}/${data.length}`)
				.mainHeader('Header', data[index])
				.buttons(
					...[
						builder.button.url({
							display: 'Original Source',
							url: data[index]
						}),
						index + 1 !== data.length
							? builder.button.reply({
									display: 'Next Image',
									id: `.waifupic next ${args[2]} ${args[3]} ${data[index + 1]} ${JSON.stringify(data)}`
								}) /* eslint-disable-line */
							: builder.button.reply({
									display: `Search More ${args[2].capitalize()}`,
									id: `.waifupic ${args[2]} -${args[3]}`
								}) /* eslint-disable-line */,
						index !== 0
							? builder.button.reply({
									display: 'Previous Image',
									id: `.waifupic prev ${args[2]} ${args[3]} ${data[index - 1]} ${JSON.stringify(data)}`
								}) /* eslint-disable-line */
							: null
					].filter(Boolean)
				);

			const messageBuilt = await builder.render();

			return await client.instance.relay(from, messageBuilt.message, { messageId: messageBuilt.key.id });
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
				await client.instance.reply(from, result.error, message);
				continue;
			}

			const builder = new client.instance.TemplateBuilder.Native(client);

			builder
				.mainBody('Waifu Pics'.formatHeaders())
				.mainFooter(`Provided by waifu.pics\n1/${result.length}`)
				.mainHeader('Header', result[0])
				.buttons(
					...[
						builder.button.url({
							display: 'Original Source',
							url: result[0]
						}),
						builder.button.reply({
							display: 'Next Image',
							id: `.waifupic next ${querie} ${nsfw ? 'nsfw' : 'sfw'} ${result[1]} ${JSON.stringify(result)}`
						})
					]
				);

			const messageBuilt = await builder.render();

			return await client.instance.relay(from, messageBuilt.message, { messageId: messageBuilt.key.id });
		}
	}
};
