import { handleAnswer } from "../../Utils/Games/index.js";

export const handler = async ({ message, from, body }, client) => {
	const handle = await handleAnswer(from, body);
	const { question, answers, status, progress } = handle;
	if (status == "playing") await client[botNum].reply(from, `${question}\n\n${answers.map((v, i) => `${i + 1}. ${v}`).join("\n")}\n6. Exit\n\nProgress : ${progress.toFixed(2)}%`);
	if (status == "win") await client[botNum].sendMessage(from, { image: { url: answers[0].absolute_picture_path }, caption: `Name : ${answers[0].name}\nDescription : ${answers[0].description}` }, { quted: message });
	if (status == "exitted") await client[botNum].reply(from, "You have exitted the game.");
};
