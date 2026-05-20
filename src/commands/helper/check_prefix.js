import configuration from '../../helper/config/connect.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'checkprefix',
	minifiedDescription: 'Check Prefix',
	description: 'Shows the current bot prefix configuration.',
	usage: '!checkprefix',
	aliases: ['cekprefix', 'prefix'],
	category: 'Helper',
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ from, message }, client) {
		const config = configuration.prefix.config;

		if (!config) {
			return await client.reply(from, 'Prefix configuration is not available yet.', message);
		}

		const mode = config.multi ? 'Multi' : config.nopref ? 'No Prefix' : 'Single';
		const prefixes = config.prefixValues || [config.pref || '.'];

		const text = `${'Prefix Configuration'.formatHeaders()}

Mode : ${mode}
Default Prefix : ${config.pref || '.'}
Active Prefixes : ${config.nopref ? '(any text triggers commands)' : prefixes.join(' ')}`;

		await client.reply(from, text.trim(), message);
	}
});
