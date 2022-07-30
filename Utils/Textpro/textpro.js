import Axios from "axios";
import FormData from "form-data";

export const textpro = (api, texts) =>
	new Promise(async (resolve, reject) => {
		try {
			let form = new FormData();
			let { data, headers } = await Axios.get(api);
			let $ = cheerioLOAD(data);
			let token = $('input[name="token"]').attr("value");
			const howManyText = $("li.item-content").get().length;
			const cookie = headers["set-cookie"][0].split(";")[0];
			const textSplitted = texts.split(" ");
			const textsParsedByLength = [textSplitted.slice(0, Math.round(textSplitted.length / howManyText)).join(" "), textSplitted.slice(-Math.abs(Math.floor(textSplitted.length / howManyText))).join(" ")];
			for (const text of textsParsedByLength) {
				form.append("text[]", text);
			}
			form.append("submit", "Go");
			form.append("token", token);
			form.append("build_server", "https://textpro.me");
			form.append("build_server_id", 1);
			data = (
				await Axios.post(api, form, {
					headers: {
						cookie,
						...form.getHeaders(),
					},
				})
			).data;
			$ = cheerioLOAD(data);
			const jsonDataRaw = $("div#form_value.sr-only").text();
			if (NO_VAL(jsonDataRaw)) return resolve({ error: "Process Failed. Reason : No Token found at the last step." });
			const jsonData = JSON.parse(JSON.parse(JSON.stringify(`${$("div#form_value.sr-only").text().split("}{")[0]}}`)));
			token = jsonData["token"];
			form = null;
			form = new FormData();
			form.append("id", jsonData["id"]);
			for (const text of textsParsedByLength) {
				form.append("text[]", text);
			}
			form.append("submit", "Go");
			form.append("token", token);
			form.append("build_server", "https://textpro.me");
			form.append("build_server_id", 1);
			data = (
				await Axios.post(CREATE_URL(), form, {
					headers: {
						cookie,
						...form.getHeaders(),
					},
				})
			).data;
			resolve(parseUrlDownload(data));
		} catch (err) {
			reject(err);
		}
	});

const CREATE_URL = () => "https://textpro.me/effect/create-image";
const NO_VAL = (v) => v == "" || v == undefined || v == null || v == false;
const parseUrlDownload = ({ image_code, session_id, code, image }) => {
	return { preview: `https://textpro.me${image}`, dl: `https://textpro.me/save-images/${image_code}/${session_id}/${code}` };
};
