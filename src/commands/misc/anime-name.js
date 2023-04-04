import { animeName, animeNameOptions as _options } from '../../utils/index.js';

const animeNameOptions = Object.keys(_options);

export default {
	name: 'animename',
	description: 'Find your Nickname in Anime Style.',
	usage: `!animename <query> <--options>\n\nOptions : \n${animeNameOptions.map((v, i) => `${i + 1}. ${v}`).join('\n')}`,
	aliases: ['animname', 'animnama'],
	category: 'Misc',
	cooldown: 3,
	limit: 2,
	status: 'enable',
	run: async ({ query, from, message, groupMetadata }, client) => {
		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You need to provide query.');
		}

		const options = !/[1-6]/.test(query) ? 0 : query.match(/[1-6]$/)?.[0] - 1 === undefined ? 0 : query.match(/[1-6]$/)[0] - 1;

		const result = await animeName(query.replace(/[0-9]/g, ''), animeNameOptions[options]);

		client[botNum].reply(
			{ groupMetadata, from, quoted: message },
			`${'Anime Name'.formatHeaders()}

${result.map((v, i) => `${i + 1}. ${v.name}${v.meaning ? `\n${v.meaning}` : ''}`).join('\n\n')}`
		);
	}
};
