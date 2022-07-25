import FormData from "form-data";
import Axios from "axios";
import fs from "fs";
import { isURL } from "../../Helper/Modules/index.js";

const isValidImageURL = async (url) => {
	try {
		const data = await fetch(url.replace("https:", "http:"));
		if (data.status !== 200) return false;
		return true;
	} catch (error) {
		return false;
	}
};

export const traceMoe = async (file) =>
	new Promise(async (resolve) => {
		try {
			if (isURL(file) && isValidImageURL(file)) file = await fetchBUFFER(file);
			else if (isURL(file) && !(await isValidImageURL(file))) return resolve({ error: "Invalid image URL" });
			else file = fs.readFileSync(file);
			const form = new FormData();
			form.append("image", file);
			const {
				data: { result: result },
			} = await Axios.post(URL_BASE(), form);
			result.forEach((element) => {
				element.similarity = Number((element.similarity * 100).toFixed(2));
			});
			resolve(result);
		} catch (error) {
			resolve({ error: error.message });
		}
	});

const URL_BASE = () => `https://api.trace.moe/search?cutBorders&`;
