import dayjs from 'dayjs';

import configuration from '../../helper/config/connect.js';
import { Wordle } from '../../utils/games/index.js';
import { INFOLOG, color } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'wordle',
	description: 'Play Wordle',
	usage: '!wordle <play/exit/info>',
	category: 'Games',
	aliases: ['wordl'],
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ from, message, query, args, sender, prettyNumber, groupMetadata }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply('Please specify arguments.\n\nUsage: !wordle <play/exit/info>', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (args[1] === 'play') {
			const wordle = new Wordle(sender);

			if (configuration.games.wordle.has(sender) && wordle.message) {
				return await client[botNum].reply('You are already playing Wordle.', { from, quoted: message, groupMetadata });
			}

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Wordle Game Answer : ', '#01cdfe')} ${color(wordle.word, 'white')} to ${color(prettyNumber, '#ff71ce')}`
			);

			const data = await client[botNum].reply(`${wordle.board.join('')}\nTot. words : ${wordle.word.length}`, {
				from,
				quoted: message,
				groupMetadata
			});

			wordle.messages = data;
		} else if (args[1] === 'exit') {
			if (!configuration.games.wordle.has(sender)) {
				return await client[botNum].reply('You are not playing Wordle.', { from, quoted: message, groupMetadata });
			}

			const wordle = new Wordle(sender);

			wordle.exit();

			await client[botNum].reply('You have exited Wordle.', { from, quoted: message, groupMetadata });
		} else if (args[1] === 'info') {
			await client[botNum].reply(
				'This is a Wordle Game. You have given a word with only 5 letter. And you have to guess the word, Every guessed word will checked and measured by how closed the input to the word is.\n\nGreen [🟩] : Correct Alphabet\nYellow [🟨] : Close\nBlack [⬛] : Not Close/Invalid\nWhite [⬜] : First Board Play.\n\nUsage: !wordle <play/exit/info>',
				{ from, quoted: message, groupMetadata }
			);
		}
	}
};
