import Brainly from "brainly-scraper-v2";
const LANG = ["id", "us", "es", "ru", "ro", "pt", "tr", "ph", "pl", "hi"];

export const brainlySearch = (query, { lang = "id", count = Number(5) }) =>
	new Promise(async (resolve) => {
		try {
			if (count > 30) {
				resolve({ error: "Max count is 30" });
			}
			if (count == 0) {
				resolve({ error: "Count cannot be 0" });
			}
			if (!LANG.includes(lang)) {
				resolve({ error: `Language not supported\n\nChoose either of one of this : ${LANG.join(", ")} or leave it blank. (Indonesia will be used)` });
			}
			const { data } = await Brainly(query, count, lang);
			resolve(parseAnswers(data));
		} catch (err) {
			reject(err);
		}
	});

const parseAnswers = (arr) =>
	arr.map((item) => ({
		pertanyaan: item.pertanyaan,
		jawaban: item.jawaban.map((answer) => answer.text.replace("amp;", "")),
	}));
