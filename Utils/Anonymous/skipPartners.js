import { CheckIntervals } from "../Misc/index.js";
import { search } from "./index.js";

export const skip = (key, timer, client, message, isStop) => {
	const status = anonymous.get(key) || Array.from(anonymous.values()).find((k) => k.partner == key) || undefined;
	let results;
	if (status) {
		if (status.partner == null) return { status: "searching", seconds: CheckIntervals(intervals["anonymous"].get(key)).timer };
		results = anonymous.has(key) ? { partner1: key, partner2: anonymous.get(key).partner } : { partner1: anonymous.get(Array.from(anonymous.keys()).find((k) => anonymous.get(k).partner == key)).partner, partner2: Array.from(anonymous.keys()).find((k) => anonymous.get(k).partner == key) };
		if (anonymous.has(key)) {
			anonymous.delete(key);
		} else {
			anonymous.delete(Array.from(anonymous.keys()).find((k) => anonymous.get(k).partner == key));
		}
		if (!isStop) search(key, timer, client, message);
		return results;
	}
	return false;
};
