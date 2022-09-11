/* global botNum, Buffer */
import { GithubGraph } from '../../Helper/index.js';

export default {
	name: 'githubgraph',
	description: 'Lookup for User Contribution Graph',
	usage: '!githubgraph <query>',
	aliases: ['ghgraph', 'gitgraph'],
	category: 'Look-up',
	cooldown: 6,
	limit: 3,
	status: 'enable',
	async run({ from, query, message }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a GitHub User');
		}

		const git = new GithubGraph();

		await git.init(query, 'DRACULA');

		git.fillBackground().createLines({ round: true });

		await git.textHeaders();

		await client[botNum].sendMessage(from, { image: new Buffer.from(git.toBuffer()) });
	},
};
