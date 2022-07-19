import { handleAnswer } from "../../Utils/Games/index.js";
import { getSession } from "../../Utils/Games/index.js";

export default {
	async handler(message, client) {
		if (!getSession(message.from)) return;
		const play = async () => {
			const handle = await handleAnswer(message.from, message.body);
			const { question, answers, status, progress, progressBar, arrow } = handle;
			if (status == "waiting") return;
			if (status == "playing") await client[botNum].reply({ from: message.from, quoted: message.message }, `${question}\n\n${answers.map((v, i) => `${i + 1}. ${v}`).join("\n")}\n6. Exit\n7. Back/Undo\n\nProgress : ${progress.toFixed(2)}% ${arrow}\n${progressBar}`);
			if (status == "win")
				await client[botNum].sendMessage(
					message.from,
					{ image: { url: answers[answers.length - 1].absolute_picture_path }, caption: `Name : ${answers[answers.length - 1].name}\nDescription : ${answers[answers.length - 1].description}\nProgress : ${progress}\n${progressBar}` },
					{ quted: message.message },
				);
			if (status == "exitted") await client[botNum].reply({ from: message.from, quoted: message }, "You have exitted the game.");
			if (status == "back") {
				if (handle.isFailed) return await client[botNum].reply({ from: message.from, quoted: message.message }, "You can't go back.");
				await client[botNum].reply({ from: message.from, quoted: message.message }, `${question}\n\n${answers.map((v, i) => `${i + 1}. ${v}`).join("\n")}\n6. Exit\n7. Back/Undo\n\Progress : ${progress.toFixed(2)}% ${arrow}\n${progressBar}`);
			}
		};
		if (message.isGroup && (message[message.from].games == "enable" || message.isAdmin) && !OPTIONS.onlyLogs) play();
		else if (!message.isGroup && !OPTIONS.onlyLogs) await play();
	},
};
