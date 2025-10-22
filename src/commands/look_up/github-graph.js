import parser from 'yargs-parser';
import { GitHubGraph } from '../../helper/index.js';

let themes = null;

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
			return await client.instance.reply(from, 'Please specify a GitHub User', message);
		}

		const { _: username, theme } = parser(query, {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				theme: ['t']
			}
		});

		const git = new GitHubGraph();

		if (!themes) {
			themes = Object.keys(git.themes).map((v) => v.toLowerCase());
		}

		if (!username || username.length === 0) {
			return await client.instance.reply(from, 'Please specify a GitHub User', message);
		}

		if (theme === true) {
			return await client.instance.reply(from, `List of themes:\n\n${themes.join(', ')}`, message);
		}

		if (!themes.includes(theme.toLowerCase())) {
			return await client.instance.reply(
				from,
				`Please specify a valid themes, this is a list of available themes:\n\n${themes.join(', ')}`,
				message
			);
		}

		const init = await git.init(username, { round: true, theme: theme.toUpperCase(), backgroundMesh: true });

		const create = await init.createGitHubGraph();

		const buffer = create.toBuffer();

		await client.instance.send(from, { image: new Buffer.from(buffer) }, { quoted: message });
	}
};
