import { GetSambungKataSession, SambungKata } from "../../Utils/Games/index.js";

export default {
	name: "sambungkata",
	description: "Word Play Game",
	usage: "!sambungkata",
	aliases: ["sambung"],
	category: "Games",
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run({ isGroup, message, from, sender, query }, client) {
		if (!isGroup) {
			return await client[botNum].reply({ from, quoted: message }, "This feature only for groups");
		}
		const statusGame = GetSambungKataSession(from);
		if (!statusGame) {
			new SambungKata(sender, undefined, from);
			await client[botNum].sendMessage(from, {
				buttonText: "Open List",
				title: "Sambung Kata",
				text: "\t",
				footer: "Void Bot Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
				sections: [{ rows: [{ title: "Play", rowId: `.sambung player 2` }], title: "VOID BOT | Word Game" }],
			});
		} else if (query == "player 2") {
			if (statusGame.checkStatus() == "waiting" && (statusGame.player1 == sender || statusGame.player2 == sender)) {
				await client[botNum].reply({ from, quoted: message }, statusGame.throwResponse().message);
				return;
			} else if (statusGame.checkStatus() == "playing" && (statusGame.player1 == sender || statusGame.player2 == sender)) {
				await client[botNum].reply({ from, quoted: message }, statusGame.throwResponse().message);
				return;
			} else if (statusGame.player1 !== sender && statusGame.player2 == undefined && statusGame.checkStatus() == "waiting") {
				const data = await statusGame.start(sender, client);
				await client[botNum].sendMessage(from, {
					text: `This is Word Play Game.

Guess the word for given clue :
Word : ${data.value}
Clue : ${data.clue}
Turn : @${data.turn.split("@")[0]}`,
					mentions: [data.turn],
				});
			}
		}
	},
};
