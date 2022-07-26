import { isURL, uploadToTelegraph } from "../../Helper/Modules/index.js";

const isValidImageURL = async (url) => {
	try {
		const data = await fetch(url.replace("https:", "http:"));
		if (data.status !== 200) return false;
		return true;
	} catch (error) {
		return false;
	}
};

export const sauceNao = async (file) =>
	new Promise(async (resolve) => {
		try {
			if (!isURL(file)) file = await uploadToTelegraph(file);
			else if (isURL(file) && !(await isValidImageURL(file))) return resolve({ error: "Invalid image URL" });
			const data = await fetchTEXT(URL_BASE(file));
			const $ = cheerioLOAD(data);
			const result = $("#middle > div:nth-child(2)");
			const results = {
				title: result.find("div.resulttitle > strong").text(),
				description: result.find("div.resulttitle").text(),
				timestamp: result.find("div.resultcontentcolumn > span:nth-child(7)").text(),
				similarity: Number(result.find("div.resultmatchinfo > div.resultsimilarityinfo").text().replace("%", "")),
				MAL: result.find("div.resultmatchinfo > div.resultmiscinfo > a:nth-child(4)").attr("href"),
			};
			resolve(results);
		} catch (error) {
			resolve({ error: error.message });
		}
	});

const URL_BASE = (input) => `https://saucenao.com/search.php?url=${input}`;
