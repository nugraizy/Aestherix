import configuration from '../../helper/config/connect.js';
import { Wordle } from '../../utils/games/index.js';
import { loggers, color } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'wordle',
	minifiedDescription: 'Play Wordle',
	description: 'Play Wordle.',
	usage: '!wordle `<play/exit/info>`',
	category: 'Games',
	aliases: ['wordl'],
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ from, message, query, args, sender, prettyNumber }, client) {
		if (!query) {
			return await client.instance.reply(from, 'Please specify arguments.\n\nUsage: !wordle <play/exit/info>', message);
		}

		if (args[1] === 'play') {
			const wordle = new Wordle(sender);

			if (configuration.games.wordle.has(sender) && wordle.message) {
				return await client.instance.reply(from, 'You are already playing Wordle.', message);
			}

			loggers.warning(
				`${color('Wordle Game Answer : ', '#FF99C8')} ${color(wordle.word, 'white')} to ${color(prettyNumber, '#E4C1F9')}`
			);

			const data = await client.instance.reply(
				from,
				`${wordle.board.join('')}\n\nTot. words : ${wordle.word.length}`,
				message
			);

			wordle.messages = data;
		} else if (args[1] === 'exit') {
			if (!configuration.games.wordle.has(sender)) {
				return await client.instance.reply(from, 'You are not playing Wordle.', message);
			}

			const wordle = new Wordle(sender);

			wordle.exit();

			await client.instance.reply(from, 'You have exited Wordle.', message);
		} else if (args[1] === 'info') {
			await client.instance.reply(
				`Wordle Game

Guess the hidden 5-letter word.
Each time you make a guess, the game will evaluate how close your guess is to the correct word.

- 🟩 Green: Correct letter in the correct position
- 🟨 Yellow: Correct letter in the wrong position
- ⬛ Black: Letter is not in the word
- ⬜ White: Initial state before any guesses

Can you find the word in as few attempts as possible?\n\nUsage: !wordle <play/exit/info>`,
				message
			);
		}
	}
};
