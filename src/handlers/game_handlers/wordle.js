import configuration from '../../helper/config/connect.js';

const handler = async ({ from, isAdmin, isGroup, body, message, sender, groupMetadada }, client, settings) => {
	const play = async () => {
		const wordle = configuration.games.wordle.get(sender);

		if (wordle?.isPlaying()) {
			const guess = wordle.checkInput(body);

			if (guess?.isWin) {
				return await client[botNum].send(
					from,
					{
						text: `You win!

${guess.board}
${guess.words}

Statistic : 
${guess.guessed.map((v, i) => `${i + 1}. ${v.input}\n${v.board}`).join('\n')}

Lama permainan : ${wordle.timeLength}`
					},
					{ groupMetadada, quoted: message }
				);
			}

			return await client[botNum].reply({ groupMetadada, from, quoted: message }, guess.board);
		}
	};

	if (isGroup && (settings[from]?.games === 'enable' || isAdmin) && !configuration.OPTIONS.onlyLogs) {
		await play();
	} else if (!isGroup && !configuration.OPTIONS.onlyLogs) {
		await play();
	}
};

const wordleHandler = handler;

export default wordleHandler;
