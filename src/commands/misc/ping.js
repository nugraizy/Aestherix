import { Timer } from '../../utils/modules/index.js';

const formatDuration = (ms) => {
	const seconds = ms / 1000;

	if (seconds < 1) {
		return `${seconds.toFixed(3)} s`;
	} else {
		return `${parseFloat(seconds.toFixed(3))} s`;
	}
};

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
		const timer = new Timer('${s}s (${ms} ms)');

		timer.start();

		const wait = await client.instance.waitMessage(from, 'Pong!', message);

		timer.stop();

		await wait.update(`Pong! ${timer.toString()}`);
	}
};
