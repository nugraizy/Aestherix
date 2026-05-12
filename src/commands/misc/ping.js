/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		const t = performance.now();

		const wait = await client.waitMessage(from, 'Pong!', message);

		await wait.update(`Pong! ${(performance.now() - t).toFixed(1)} ms`);
	}
};
