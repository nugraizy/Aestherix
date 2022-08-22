export default {
	async handler({ from, isAdmin, isGroup, body, message, sender }, client, settings) {
		const play = async () => {
			const wordle = games.wordle.get(sender);
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
${guess.guessed.map((v, i) => `${i + 1}. ${v.input}\n${v.board}`).join("\n")}`,
						},
						{ quoted: message },
					);
				}
				return await client[botNum].reply({ from, quoted: message }, guess.board);
			}
		};
		if (isGroup && (settings[from].games == "enable" || isAdmin) && !OPTIONS.onlyLogs) {
			await play();
		} else if (!isGroup && !OPTIONS.onlyLogs) {
			await play();
		}
	},
};
