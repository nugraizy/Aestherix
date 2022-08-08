import { instafier } from "../../Utils/Instagram Notifier/index.js";
import dotenv from "dotenv";
dotenv.config();

export const handler = async () => {
	try {
		const client = await instafier.ev();

		client.fbns.on("onDeleted", (message) => {});

		client.realtime.on("onMessage", (message) => {});
	} catch (err) {
		log(err);
	}
};
