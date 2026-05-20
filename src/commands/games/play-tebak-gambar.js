import { color, loggers } from '../../utils/modules/index.js';
import { startTG } from '../../utils/games/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'tebakgambar',
	minifiedDescription: 'Play Guess',
	description: 'Play Guess the image.',
	usage: '!tebakgambar',
	aliases: ['tg', 'tebak'],
	category: 'Games',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		loggers.warning(`${color('Starting Guess The Image Games.', 'pink')}  to ${color(message.prettyNumber, 'lilac')}`);

		const game = await startTG(client, message.from, message, 20);

		if (game.status === 'playing') {
			return await client.reply(message.from, `Your game is already playing!\n${game.remaining}s left`, game.data);
		}
	}
});
