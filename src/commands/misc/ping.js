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
		const start = performance.now();

		await client.instance.send(
			from,
			{ text: `Pong! ${(performance.now() - start).toFixed(3)} seconds` },
			{
				quoted: message
			}
		);
	}
};
