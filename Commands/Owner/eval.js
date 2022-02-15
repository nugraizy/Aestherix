import * as util from "util";
import fs from "fs";
import { exec } from "child_process";

export default {
	name: "eval",
	description: "Evaluates code.",
	usage: "!eval <code>",
	aliases: ["eval", ">", ">>", "=>"],
	category: "Owner",
	async run(message, client) {
		if (!message.isOwner) return client[botNum].reply(message.from, "You are not allowed to use this command");
		if (!message.query) return client[botNum].reply(message.from, "Please specify code to evaluate");
		if (message.isBaileys) return;
		try {
			let { from, extractMediaData, mediaData, type, typeQuoted, body, adminGroups, participants, pushname, bodyQuoted } = message;
			if (body.startsWith("> ")) {
				let types = Function;
				let output;
				if (/await/.test(body)) types = AsyncFunction;
				const func = new types("print", "client", "message", "fs", "from", "extractMediaData", "mediaData", "type", "typeQuoted", "body", "adminGroups", "participants", "pushname", "bodyQuoted", body.slice(2));
				output = func(
					(...args) => {
						client[botNum].reply(from, util.format(...args));
					},
					client[botNum],
					message,
					fs,
					from,
					extractMediaData,
					mediaData,
					type,
					typeQuoted,
					body,
					adminGroups,
					participants,
					pushname,
					bodyQuoted,
				);
			} else if (body.startsWith(">> ")) {
				exec(body.slice(3), async (err, stdout, stderr) => {
					if (err) return client[botNum].reply(from, util.format(err));
					await client[botNum].reply(from, util.format(stdout.replace(col, "").trim()));
				});
			} else if (body.startsWith("=> ") || body.startsWith(">>> ")) {
				if (body.includes("/s")) {
					body = body.replace("/s", "");
				}
				if (body.includes("/as")) {
					body = body.replace("/as", "");
					if (body.startsWith("=> ")) return await client[botNum].reply(from, util.format(eval(`(async()=>{${body.slice(3)}})()`)));
					if (body.startsWith(">>> ")) return await client[botNum].reply(from, util.format(eval(`(async()=>{${body.slice(4)}})()`)));
				}
				if (body.startsWith("=> ")) client[botNum].reply(from, util.format(eval(body.slice(3))));
				if (body.startsWith(">>> ")) client[botNum].reply(from, util.format(eval(body.slice(4))));
			}
		} catch (err) {
			let str = `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			return client[botNum].reply(message.from, `\`ERROR\` \`\`\`\n\n${str}\`\`\``);
		}
	},
};

const col = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
