import { delay, generateMessageID } from "@adiwajshing/baileys";
import { Werewolf } from "../../Utils/Games/index.js";
const row = [
	{ rows: [{ title: "JOIN", rowId: `.ww join` }], title: `VOID BOT | Werewolf Games` },
	{ rows: [{ title: "NEW GAME", rowId: `.ww newGame` }], title: `VOID BOT | Werewolf Games` },
	{ rows: [{ title: "EXIT GAME", rowId: `.ww exit` }], title: `VOID BOT | Werewolf Games` },
	{ rows: [{ title: "DELETE GAME", rowId: `.ww delete` }], title: `VOID BOT | Werewolf Games` },
];

export default {
	name: "werewolf",
	description: "Play Werewolf",
	usage: "!ww <arguments>",
	category: "Games",
	aliases: ["ww"],
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run({ from, message, args, sender, pushname }, client) {
		if (args[1] == "kill") {
			const werewolf = new Werewolf(sender, args[3], client);
			const kill = werewolf.killPlayerAsWerewolf(sender, args[2], args[3]);
			if (kill.error && !("data" in kill)) return client[botNum].reply({ from, quoted: message }, kill.message);
			for (const data of kill.data) {
				await client[botNum].sendMessage(data.id, { text: data.message });
			}
		} else if (args[1] == "seer") {
			const werewolf = new Werewolf(sender, args[3], client);
			const seer = werewolf.seerSomeone(sender, args[2], args[3]);
			if (seer.error && !("data" in seer)) return client[botNum].reply({ from, quoted: message }, seer.message);
			for (const data of seer.data) {
				await client[botNum].sendMessage(data.id, { text: data.message });
			}
		} else if (args[1] == "guard") {
			const werewolf = new Werewolf(sender, args[3], client);
			const guard = werewolf.seerSomeone(sender, args[2], args[3]);
			if (guard.error && !("data" in guard)) return client[botNum].reply({ from, quoted: message }, guard.message);
			for (const data of guard.data) {
				await client[botNum].sendMessage(data.id, { text: data.message });
			}
		} else if (args[1] == "vote") {
			const werewolf = new Werewolf(sender, args[3], client);
			const vote = werewolf.voteSomeone(sender, args[2], args[3]);
			if (vote.error && !("data" in vote)) return client[botNum].reply({ from, quoted: message }, vote.message);
			for (const data of vote.data) {
				await client[botNum].sendMessage(data.id, { text: data.message });
			}
		} else if (args[1] == "delete") {
			const werewolf = new Werewolf(sender, from, client);
			const deletes = werewolf.deleteGame(sender);
			return client[botNum].reply({ from, quoted: message }, deletes.message);
		} else if (args[1] == "join") {
			sender = args[2] || sender;
			pushname = args[3] || pushname;
			const werewolf = new Werewolf(sender, from, client);
			const join = werewolf.werewolfJoin(sender, from, pushname);
			return join.error
				? client[botNum].reply({ from, quoted: message }, join.message)
				: client[botNum].sendMessage(from, { text: `${join.message}\n${join.mentions.map((v) => `@${v.split("@")[0]}`).join("\n")}`, mentions: join.mentions }, { quoted: message });
		} else if (args[1] == "newGame") {
			const werewolf = new Werewolf(sender, from, client);
			const newGame = werewolf.setNewGame();
			return client[botNum].reply({ from, quoted: message }, newGame.message);
		} else if (args[1] == "exit") {
			const werewolf = new Werewolf(sender, from, client);
			const exit = werewolf.exitGame(sender, from);
			return client[botNum].reply({ from, quoted: message }, exit.message);
		} else if (args[1] == "start") {
			const werewolf = new Werewolf(sender, from, client);
			const start = werewolf.startGame(sender, from);
			if (start.error) return client[botNum].reply({ from, quoted: message }, start.message);
			await client[botNum].sendMessage(from, { text: start.message });
			await client[botNum].sendMessage(from, {
				text: `~ Player Werewolf ~\n\n${start.data.playersData.map((v, i) => `${i + 1}. @${v.id.split("@")[0]} | ${v.name}`).join("\n")}`,
				mentions: start.data.playersData.map((v) => v.id),
			});
			await delay(3000);
			await client[botNum].sendMessage(from, { text: start.data.gameDialogue.replace("{0}", start.data.gameTime) });
			for (const player of start.data.playersData) {
				if (player.role == "villager") {
					await client[botNum].sendMessage(player.id, { text: player.dialogue });
				} else if (player.role == "werewolf") {
					await client[botNum].relayMessage(
						player.id,
						{
							listMessage: {
								buttonText: "Open list",
								description: `Kamu adalah Serigala. Dan saat ini merupakan waktu yang tepat untuk membunuh seseorang.\nPilih salah satu player.`,
								footerText: "\t",
								listType: 1,
								sections: Array(start.data.playersData.length)
									.fill(undefined)
									.map((v, i) => {
										return { rows: [{ title: `KILL ${start.data.playersData[i].name}`, rowId: `.ww kill ${start.data.playersData[i].id} ${from}` }], title: `VOID BOT | Werewolf Games` };
									}),
							},
						},
						{ messageId: generateMessageID() },
					);
				} else if (player.role == "seer") {
					await client[botNum].relayMessage(
						player.id,
						{
							listMessage: {
								buttonText: "Open list",
								description: `Kamu adalah Penerawang. Dan saat ini merupakan waktu yang tepat untuk menerawang seseorang.\nPilih salah satu player.`,
								footerText: "\t",
								listType: 1,
								sections: Array(start.data.playersData.length)
									.fill(undefined)
									.map((v, i) => {
										return { rows: [{ title: `TERAWANG ${start.data.playersData[i].name}`, rowId: `.ww seer ${start.data.playersData[i].id} ${from}` }], title: `VOID BOT | Werewolf Games` };
									}),
							},
						},
						{ messageId: generateMessageID() },
					);
				} else if (player.role == "guard") {
					await client[botNum].relayMessage(
						player.id,
						{
							listMessage: {
								buttonText: "Open list",
								description: `Kamu adalah Penjaga. Dan saat ini merupakan waktu yang tepat untuk memjaga seseorang.\nPilih salah satu player.`,
								footerText: "\t",
								listType: 1,
								sections: Array(start.data.playersData.length)
									.fill(undefined)
									.map((v, i) => {
										return { rows: [{ title: `JAGA ${start.data.playersData[i].name}`, rowId: `.ww guard ${start.data.playersData[i].id} ${from}` }], title: `VOID BOT | Werewolf Games` };
									}),
							},
						},
						{ messageId: generateMessageID() },
					);
				}
			}
			start.data.startGameCycle(from, start.data.gameTimeCycle);
		} else {
			const werewolfs = new Werewolf(sender, from, client);
			if (werewolfs.getDataGame(from)) {
				await client[botNum].relayMessage(
					from,
					{
						listMessage: {
							buttonText: "Open list",
							description: "Sesi sudah ada di group ini. Pilih join untuk bergabung ke permainan",
							footerText: "\t",
							listType: 1,
							sections: row,
						},
					},
					{ messageId: generateMessageID() },
				);
				return;
			}
			const werewolf = new Werewolf(sender, from, client, pushname, true);
			const caption = "Permainan Werewolf berhasil dibuat.";
			await client[botNum].relayMessage(
				from,
				{
					listMessage: {
						buttonText: "Open list",
						description: `${caption}\nPilih salah satu.`,
						footerText: "\t",
						listType: 1,
						sections: row,
					},
				},
				{ messageId: generateMessageID() },
			);
		}
	},
};
