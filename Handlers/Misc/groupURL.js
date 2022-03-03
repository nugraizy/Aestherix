import moment from "moment-timezone";
import { CheckIntervals, DeleteIntervals, SetIntervals } from "../../Utils/Misc/index.js";

export async function handler(message, client) {
	const {
		from,
		message: {
			key: { id },
		},
		body,
		sender,
		isAdmin,
		isFromMe,
		isBotAdmin,
	} = message;
	if (!regex(body)) return;
	if (!(await checkURL(client, body.match(/chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i)[0].replace("chat.whatsapp.com/", "")))) return;
	if (CheckIntervals(intervals["url"].get(sender)) !== 0 && CheckIntervals(intervals["url"]?.get(sender)?.get(id)) !== 0) {
		await client[botNum].groupParticipantsUpdate(from, [sender], "remove");
		DeleteIntervals(intervals["url"].get(sender).get(id), intervals["url"].get(sender), id);
		return;
	}
	if (CheckIntervals(intervals["url"].get(sender)) !== 0 && !CheckIntervals(intervals["url"].get(sender).has(from))) {
		await client[botNum].reply(from, "You already on blacklist");
		await client[botNum].groupParticipantsUpdate(from, [sender], "remove");
		return;
	}
	if (message[from].antiURL == "enable" && !isAdmin && !isFromMe && !intervals["url"].get(sender)?.has(id)) {
		const starts = new Date();
		const ends = moment(starts)
			.add(10 + 2, "seconds")
			.valueOf();
		await client[botNum].reply(from, "Please revoke your URL or you'll be kicked in 10 seconds");
		SetIntervals(
			intervals["url"].set(sender, new Map()).get(sender),
			from,
			10,
			async (remaining = ends, froms = from, ids = sender, isBotAdmins = isBotAdmin, clients = client, messages = message) => {
				if (intervals["url"].get(ids)?.get(froms) === undefined) return;
				const second = Math.floor(((remaining - new Date().getTime()) % (1000 * 60)) / 1000);
				intervals["url"].get(ids).get(froms).timer = second;
				if (second == 5 && isBotAdmins) await client[botNum].sendMessage(froms, { text: "Remaining time 5 seconds. Or you'll be kicked." }, { quoted: messages.message });
				if (second <= 0) {
					if (isBotAdmins) await clients[botNum].groupParticipantsUpdate(froms, [ids], "remove");
					DeleteIntervals(intervals["url"].get(ids).get(froms), intervals["url"].get(ids), froms);
				}
			},
			{
				id,
			},
		);
	}
}

function regex(input) {
	return /chat.whatsapp.com\/([\w\d]*)/g.test(input);
}

async function checkURL(client, input) {
	try {
		const query = await client[botNum].query({
			tag: "iq",
			attrs: {
				type: "get",
				xmlns: "w:g2",
				to: "@g.us",
			},
			content: [{ tag: "invite", attrs: { code: input } }],
		});
		return true;
	} catch (e) {
		return false;
	}
}
