import { handleAnswer } from "../../Utils/Games/index.js";

export const handler = async ({ message, from, body }, client) => {
	const handle = await handleAnswer(from, body);
	const { question, answers, status, progress, progressBar, arrow } = handle;
	if (status == "waiting") return;
	if (status == "playing") await client[botNum].reply(from, `${question}\n\n${answers.map((v, i) => `${i + 1}. ${v}`).join("\n")}\n6. Exit\n7. Back/Undo\n\nProgress : ${progress.toFixed(2)}% ${arrow}\n${progressBar}`);
	if (status == "win")
		await client[botNum].sendMessage(from, { image: { url: answers[answers.length - 1].absolute_picture_path }, caption: `Name : ${answers[answers.length - 1].name}\nDescription : ${answers[answers.length - 1].description}\nProgress : ${progress}\n${progressBar}` }, { quted: message });
	if (status == "exitted") await client[botNum].reply(from, "You have exitted the game.");
	if (status == "back") {
		if (handle.isFailed) return await client[botNum].reply(from, "You can't go back.");
		await client[botNum].reply(from, `${question}\n\n${answers.map((v, i) => `${i + 1}. ${v}`).join("\n")}\n6. Exit\n7. Back/Undo\n\Progress : ${progress.toFixed(2)}% ${arrow}\n${progressBar}`);
	}
};
