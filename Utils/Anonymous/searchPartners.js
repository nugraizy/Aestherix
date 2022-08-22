import moment from "moment-timezone";
import { CheckIntervals, DeleteIntervals, SetIntervals } from "../Misc/index.js";

export const search = async (key, timer, client, message) => {
	const status = Array.from(anonymous.values()).find((k) => k.partner == null) || undefined;
	if (status) {
		if (anonymous.has(key)) {
			return { status: "searching", seconds: CheckIntervals(intervals["anonymous"].get(key)).timer };
		}
		status.partner = key;
		intervals["anonymous"].get(Array.from(anonymous.keys()).find((k) => anonymous.get(k).partner == key)).partner2 = key;
		const tempMessage = anonymous.get(Array.from(anonymous.keys()).find((k) => anonymous.get(k).partner == key)).message;
		delete anonymous.get(Array.from(anonymous.keys()).find((k) => anonymous.get(k).partner == key)).message;
		return { partner1: Array.from(anonymous.keys()).find((k) => anonymous.get(k).partner == key), partner2: key, messages1: tempMessage, messages2: message };
	}
	if (anonymous.has(key)) {
		return { status: "chatting" };
	} else if (Array.from(anonymous.values()).find((k) => k.partner == key)) {
		return { status: "chatting" };
	}
	anonymous.set(key, { partner: null, message });
	const timers = moment(new Date())
		.add(parseInt(timer + 2), "seconds")
		.valueOf();
	SetIntervals(
		intervals["anonymous"],
		key,
		timer + 2,
		async (clients = client, id = key, remaining = timers) => {
			if (intervals["anonymous"].get(id) === undefined) {
				return;
			}
			const second = Math.floor(((remaining - new Date().getTime()) % (1000 * 60)) / 1000);
			const { partner1, partner2, partner1Message } = CheckIntervals(intervals["anonymous"].get(id));
			intervals["anonymous"].get(id).timer = second;
			if (partner2 !== null) {
				DeleteIntervals(intervals["anonymous"].get(id), intervals["anonymous"], id);
				return;
			}
			if (second <= 0) {
				clients[botNum].reply({ from: partner1, quoted: partner1Message }, "Your partner is not found! Try again later!");
				anonymous.delete(id);
				DeleteIntervals(intervals["anonymous"].get(id), intervals["anonymous"], id);
				return;
			}
		},
		{ partner1: key, partner2: null, partner1Message: message },
	);
	return true;
};
