import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'ping',
	minifiedDescription: 'Ping Latency',
	description: 'Ping the bot or Show bot latency.',
	usage: '!ping',
	aliases: ['pong'],
	category: 'Misc',
	cooldown: 8,
	limit: 0,
	status: 'enable',
	async run({ from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const t = performance.now();

		const wait = await client.waitMessage(from, L.info.pong, message);

		await wait.update(`${L.info.pong} ${(performance.now() - t).toFixed(1)} ms`);
	}
});
