export default {
	async handler({ from, isGroup, sender, body, message, isAdmin }, client, settings) {
		const data = games["word"].get(from);
		const play = async () => {
			if (!data) return;
			const sambung = await data.guess(body, sender, from, client);
			if (!sambung) return;
			if ("status" in sambung && !sambung.status) return await client[botNum].reply({ from, quoted: message }, sambung.message);
			await client[botNum].sendMessage(
				from,
				{
					text: `This is Word Play Game.

Guess the word for given clue :
Word : ${sambung.words}
Clue : ${sambung.clue}
Turn : @${sambung.turn.split("@")[0]}`,
					contextInfo: {
						mentionedJid: [sambung.turn],
					},
				},
				{ quoted: message },
			);
		};
		if (isGroup && (settings[from].games == "enable" || isAdmin) && !OPTIONS.onlyLogs) play();
	},
};
