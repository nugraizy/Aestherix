import * as util from "util";
import fs from "fs";
import { exec } from "child_process";
import prettier from "js-beautify";
import * as func from "../../exports.js";

export default {
	name: "eval",
	description: "Evaluates code.",
	usage: "!eval <code>",
	aliases: ["/>", "$>", "=>"],
	category: "Owner",
	cooldown: 0,
	limit: 0,
	async run(message, client) {
		let { isOwner, query, isBaileys, from, extractMediaData, mediaData, type, typeQuoted, body, adminGroups, participants, pushname, bodyQuoted } = message;
		if (!isOwner) return client[botNum].reply(from, "You are not allowed to use this command");
		if (!query) return client[botNum].reply(from, "Please specify code to evaluate");
		if (isBaileys) return;
		if (body.startsWith("/> ")) {
			try {
				let types = Function;
				let output;
				if (/await/.test(body)) types = AsyncFunction;
				const func = new types("print", "client", "message", "fs", "from", "extractMediaData", "mediaData", "type", "typeQuoted", "body", "adminGroups", "participants", "pushname", "bodyQuoted", body.slice(3));
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
			} catch (err) {
				let str = `Type : ${err.name}\n`;
				str += `Message : ${err.message}`;
				return client[botNum].reply(from, `\`ERROR\` \`\`\`\n\n${str}\`\`\``);
			}
		} else if (body.startsWith("$> ")) {
			try {
				exec(body.slice(3), async (err, stdout, stderr) => {
					if (err) return client[botNum].reply(from, util.format(err));
					await client[botNum].reply(from, util.format(stdout.replace(col, "").trim()));
				});
			} catch (err) {
				let str = `Type : ${err.name}\n`;
				str += `Message : ${err.message}`;
				return client[botNum].reply(from, `\`ERROR\` \`\`\`\n\n${str}\`\`\``);
			}
		} else if (body.startsWith("=> ")) {
			try {
				if (body.includes("/s")) {
					body = body.replace(/\/s/g, "");
					const evaled = body.slice(3);
					print(from, eval(evaled));
				} else if (body.includes("/as")) {
					body = body.replace(/\/as/g, "");
					const evaled = body.slice(3);
					print(from, eval(`(async () => {${evaled}})().catch(err => print(from, err))`));
				} else {
					print(from, eval(body.slice(3)));
				}
			} catch (err) {
				let str = `Type : ${err.name}\n`;
				str += `Message : ${err.message}`;
				return client[botNum].reply(from, `\`ERROR\` \`\`\`\n\n${str}\`\`\``);
			}
		}
	},
};

const col = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const print = (dari, ...args) => client[botNum].reply(dari, util.format(...args));
const temp = (names, func) => {
	if (!/^[a-z0-9_]+$/i.test(names)) return new Error("Invalid name.");
	if (Object.keys(func).includes(names)) return new Error("Function already exists in the script.");
	if (Object.keys(functions).includes(names)) return new Error("Function already exists in the temporary functions.");
	if (typeof func !== "function") return new Error("Argument is not a function.");
	func = prettier.js_beautify(func.toString());
	functions[names] = Function(`return ${func}`)();
	return func;
};

const clear = (names) => {
	if (!/^[a-z0-9_]+$/i.test(names)) return new Error("Invalid name.");
	if (!Object.keys(functions).includes(names)) return new Error("Function does not exist.");
	const capt = `Function is deleted\n\n${functions[names]}`;
	delete functions[names];
	return capt;
};
