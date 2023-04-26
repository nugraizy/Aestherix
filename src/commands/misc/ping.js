export default {
	name: 'ping',
	description: 'Ping the bot or Show bot latency',
	usage: '!ping',
	aliases: ['pong'],
	category: 'Misc',
	cooldown: 8,
	limit: 0,
	status: 'enable',
	async run({ from, message, groupMetadata }, client) {
		const start = performance.now();

		await client[botNum].send(
			from,
			{ text: `Pong! ${(performance.now() - start).toFixed(3)} seconds` },
			{
				quoted: message,
				groupMetadata
			}
		);
	}
};
