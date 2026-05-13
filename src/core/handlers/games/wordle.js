import configuration from '../../../helper/config/connect.js';

const handleWordle = async ({ from, isAdmin, isGroup, body, message, sender }, client, settings) => {
	const playWordle = async () => {
		const wordle = configuration.games.wordle.get(sender);

		if (!wordle?.isPlaying()) {
			return;
		}

		const guess = wordle.checkInput(body);

		if (guess?.isWin) {
			const response = {
				text: `You win!\n\n${guess.board}\n${guess.words}\n\nStatistic :\n${guess.guessed
					.map((v, i) => `${i + 1}. ${v.input}\n${v.board}`)
					.join('\n')}\n\nPlay time : ${guess.duration}`
			};

			await client.send(from, response, { quoted: message });
		} else {
			await client.reply(from, `${guess.board}\n\n${guess.message}\nPlay time : ${guess.duration}`, message);
		}
	};

	if ((!isGroup || settings[from]?.games === 'enable' || isAdmin) && !configuration.flags.onlyLogs) {
		await playWordle();
	}
};

export default handleWordle;
