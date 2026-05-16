import parser from 'yargs-parser';
import { GitHubGraph } from '../../helper/index.js';
import { cmdId } from '../../helper/modules/prefix.js';

let themes = [];

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
	async run({ from, query, message, cmd }, client) {
		if (!query) {
			return await client.reply(from, 'Please specify a GitHub User', message);
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
		const usernameQuery = username.join(' ').trim();

		if (!themes.length) {
			themes = Object.keys(git.themes).map((v) => v.toLowerCase());
		}

		if (!username || username.length === 0) {
			return await client.reply(from, 'Please specify a GitHub User', message);
		}

		if (theme === true) {
			return await client.reply(from, `List of themes:\n\n${themes.join(', ')}`, message);
		}

		if (!themes.includes(theme?.toLowerCase())) {
			const builder = new client.TemplateBuilder.Native();

			return await builder
				.destination(from)
				.footer(`Use ${cmd} ${query} --theme ${themes.random()} to create graph with specific theme.`)
				.body(`Please specify a valid themes, this is a list of available themes:\n\n${themes.join(', ')}`)
				.buttons(builder.button.reply({ display: 'Create Default Graph', id: cmdId(cmd, `${usernameQuery} --theme default`) }))
				.send();
		}

		const wait = await client.waitMessage(from, 'Creating graph. Please wait...', message);

		const init = await git.init(username, { round: true, theme: theme.toUpperCase() });

		const create = await init.createGitHubGraph();

		const buffer = create.toBuffer();

		await client.send(from, { image: new Buffer.from(buffer) }, { quoted: message });

		await wait.update('Graph created successfully!');
	}
};
