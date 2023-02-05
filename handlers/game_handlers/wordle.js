/* global botNum */
import configuration from '../../connect.js';

export default {
	async handler({ from, isAdmin, isGroup, body, message, sender }, client, settings) {
		const play = async () => {
			const wordle = configuration.games.wordle.get(sender);

			if (wordle?.isPlaying()) {
				const guess = wordle.checkInput(body);

				if (guess?.isWin) {
					return await client[botNum].sendMessage(
						from,
						{
							text: `You win!

${guess.board}
${guess.words}

Statistic : 
${guess.guessed.map((v, i) => `${i + 1}. ${v.input}\n${v.board}`).join('\n')}

Lama permainan : ${wordle.timeLength}`,
						},
						{ quoted: message },
					);
				}

				return await client[botNum].reply({ from, quoted: message }, guess.board);
			}
		};

		if (isGroup && (settings[from].games === 'enable' || isAdmin) && !configuration.OPTIONS.onlyLogs) {
			await play();
		} else if (!isGroup && !configuration.OPTIONS.onlyLogs) {
			await play();
		}
	},
};
