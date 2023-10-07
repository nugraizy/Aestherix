import { GithubGraph } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'githubgraph',
	description: 'Lookup for User Contribution Graph',
	usage: '!githubgraph <query>',
	aliases: ['ghgraph', 'gitgraph'],
	category: 'Look-up',
	cooldown: 6,
	limit: 3,
	status: 'enable',
	async run({ from, query, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please specify a GitHub User', { from, quoted: message, groupMetadata });
		}

		const git = new GithubGraph();

		await git.init(query, 'DRACULA');

		await git.fillBackground().createLines({ round: true }).placeCopyright().placeIcons();

		await git.textHeaders();

		await client[botNum].send(from, { image: new Buffer.from(git.toBuffer()) }, { groupMetadata, quoted: message });
	}
};
