import { definePlugin } from '../../core/plugin.js';

export default definePlugin({
	name: 'example-plugin',
	version: '1.0.0',
	description: 'Example plugin demonstrating the Aestherix plugin system.',
	commands: [
		{
			name: 'plugin-info',
			minifiedDescription: 'Plugin Info',
			description: 'Show loaded plugin information.',
			usage: '!plugin-info',
			aliases: ['pinfo'],
			category: 'Misc',
			cooldown: 5,
			limit: 1,
			status: 'enable',
			async run(ctx, client) {
				const { from, message, settings } = ctx;
				const prefix = settings?.prefix?.pref || '.';

				await client.reply(
					from,
					`*Plugin System Active*\n\nLoaded from: src/plugins/example-plugin/\nCommand: ${prefix}plugin-info\n\nThis is an example plugin. Create your own in src/plugins/<name>/index.js`,
					message
				);
			}
		}
	],
	hooks: {
		async beforeCommand() {
			return true;
		},
		async afterCommand() {},
		async onError() {}
	}
});
