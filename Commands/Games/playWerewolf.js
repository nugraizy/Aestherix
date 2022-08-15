import { delay, generateMessageID } from "@adiwajshing/baileys";
import { Werewolf } from "../../Utils/Games/index.js";

export default {
	name: "werewolf",
	description: "Play Werewolf",
	usage: "!ww <arguments>",
	category: "Games",
	aliases: ["ww"],
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run({ from, message, args, sender, cmd }, client) {
		const isGame = games.werewolf.has(from);
		const row = [
			{
				rows: [
					{
						title: "JOIN",
						rowId: `.ww join`,
					},
				],
				title: `VOID BOT | Werewolf Games`,
			},
			{
				rows: [
					{
						title: "NEW GAME",
						rowId: `.ww newGame`,
					},
				],
				title: `VOID BOT | Werewolf Games`,
			},
			{
				rows: [
					{
						title: "EXIT GAME",
						rowId: `.ww exit`,
					},
				],
				title: `VOID BOT | Werewolf Games`,
			},
			{
				rows: [
					{
						title: "DELETE GAME",
						rowId: `.ww delete`,
					},
				],
				title: `VOID BOT | Werewolf Games`,
			},
		];
		if (args[1] == "delete") {
			const data = games.werewolf.get(from);
			if (!data) return client[botNum].reply({ from, quoted: message }, "There is no game to delete.");
			if (data.gameStarted) return client[botNum].reply({ from, quoted: message }, "The game has already started.");
			games.werewolf.delete(from);
			return client.reply({ from, quoted: message }, "Game has been deleted.");
		} else if (args[1] == "join") {
			sender = args[2] || sender;
			const data = games.werewolf.get(from);
			if (!data) return client[botNum].reply({ from, quoted: message }, "There is no game to join.");
			const werewolf = data.werewolfJoin(sender, from);
			if (werewolf.error) return client[botNum].reply({ from, quoted: message }, werewolf.message);
			return client[botNum].sendMessage(
				from,
				{ text: `${werewolf.message}\n${werewolf.mentions.map((v) => `@${v.split("@")[0]}`).join("\n")}`, mentions: werewolf.mentions },
				{ quoted: message },
			);
		} else if (args[1] == "newGame") {
			if (isGame) return client[botNum].reply({ from, quoted: message }, "There is already a game in progress.");
			const werewolf = new Werewolf(sender, from, client);
			return client[botNum].reply({ from, quoted: message }, werewolf.message);
		} else if (args[1] == "exit") {
			const data = games.werewolf.get(from);
			const werewolf = data.exitGame(sender, from);
			return client[botNum].reply({ from, quoted: message }, werewolf.message);
		} else if (args[1] == "start") {
			const data = games.werewolf.get(from);
			if (!data) return client[botNum].reply({ from, quoted: message }, "There is no game to start.");
			const werewolf = data.startGame(sender, from);
			client[botNum].reply({ from, quoted: message }, werewolf.message);
			await delay(3000);
			client[botNum].reply({ from, quoted: message }, werewolf.data.gameDialogue.replace("{0}", werewolf.data.gameTime));
			for (const player of werewolf.data.playersData) {
				await client[botNum].sendMessage(player.id, {
					text: player.dialogue.replace(
						"{0}",
						werewolf.data.playersData
							.filter((v) => v.id !== player.id)
							.map((v) => `${v.id.split("@")[0]}`)
							.join(", "),
					),
					mentions: [player.id],
				});
			}
			werewolf.data.startGameCycle(from, werewolf.data.gameTimeCycle);
		}
		if (isGame) {
			await client[botNum].relayMessage(
				from,
				{
					listMessage: {
						buttonText: "Open list",
						description: "Sesi sudah ada di group ini. Pilih join untuk bergabung ke permainan",
						footerText: "if you can't click 'read more' : click it first then reply the list, then click on the 'x' mark on your reply.",
						listType: 1,
						sections: row,
					},
				},
				{ messageId: generateMessageID() },
			);
			return;
		}
		const werewolf = new Werewolf(sender, from, client);
		const caption = "Permainan Werewolf berhasil dibuat.";
		await client[botNum].relayMessage(
			from,
			{
				listMessage: {
					buttonText: "Open list",
					description: `${caption}\nPilih salah satu.`,
					footerText: "if you can't click 'read more' : click it first then reply the list, then click on the 'x' mark on your reply.",
					listType: 1,
					sections: row,
				},
			},
			{ messageId: generateMessageID() },
		);
	},
};
