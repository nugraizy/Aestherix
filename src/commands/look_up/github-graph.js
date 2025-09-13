import parser from 'yargs-parser';
import { GitHubGraph } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'githubgraph',
	minifiedDescription: 'Github Contribution Graph',
	description: 'Lookup for User Contribution Graph.',
	usage: '!githubgraph `<query>`',
	aliases: ['ghgraph', 'gitgraph'],
	category: 'Look-up',
	cooldown: 6,
	limit: 3,
	status: 'enable',
	async run({ from, query, message }, client) {
		if (!query) {
			return await client.instance.reply('Please specify a GitHub User', { from, quoted: message });
		}

		const { _: username, theme } = parser(query, {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				theme: ['t']
			},
			default: {
				theme: 'DEFAULT'
			}
		});

		const git = new GitHubGraph();

		const themes = Object.keys(git.themes).map((v) => v.toLowerCase());

		if (!themes.includes(theme.toLowerCase())) {
			return await client.instance.reply(
				`Please specify a valid GitHub User, this is a list of available themes:\n\n${themes.join(', ')}`,
				{ from, quoted: message }
			);
		}

		const init = await git.init(username, { round: true, theme: theme.toUpperCase() });

		const create = await init.createGitHubGraph();

		const buffer = create.toBuffer();

		await client.instance.send(from, { image: new Buffer.from(buffer) }, { quoted: message });
	}
};
