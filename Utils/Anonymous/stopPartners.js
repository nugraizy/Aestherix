import { skip } from "./skipPartners.js";

export const stop = (key, timer, client, message) => {
	return skip(key, timer, client, message, true);
};
