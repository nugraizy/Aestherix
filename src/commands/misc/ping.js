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

		const msgTimestamp = message?.messageTimestamp;

		const wait = await client.waitMessage(from, L.info.pong, message);
		const processTime = (performance.now() - t).toFixed(1);

		const latencyMs = msgTimestamp ? (Date.now() / 1000 - msgTimestamp).toFixed(1) : null;
		const latencyLine = latencyMs ? `\nLatency: ${latencyMs} s` : '';

		await wait.update(`${L.info.pong} ${processTime} ms${latencyLine}`);
	}
});
