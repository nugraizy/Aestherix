import { GitHubGraph } from '../../helper/index.js';

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

		const git = new GitHubGraph();

		const init = await git.init(query, { round: true, theme: 'DRACULA' });

		const create = await init.createGitHubGraph();

		const buffer = create.toBuffer();

		await client[botNum].send(from, { image: new Buffer.from(buffer) }, { groupMetadata, quoted: message });
	}
};
