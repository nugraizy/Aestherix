import fs from "fs";
import * as jsSplit from "js-split";
import yargsParser from "yargs-parser";
import { randomize } from "../../Helper/index.js";
import { textpro } from "../../Utils/Textpro/index.js";
const dataJSON = JSON.parse(fs.readFileSync("./Databases/Textpro/textprourl.json"));

export default {
	name: "textpro",
	description: "Image maker using texts",
	usage: `!textpro <query> <model/number[REQUIRED]> [options]\nOptions:\n-stk / -img\nAvailable Model Type : !textpro -type`,
	aliases: ["imgmake", "maker", "tpro"],
	category: "Converter",
	cooldown: 4,
	limit: 3,
	status: "enable",
	async run({ from, message, query }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please provide a query");
		try {
			const { _: parsed } = yargsParser(query, { configuration: { "short-option-groups": false } });
			let models = query.match(/(\d+|type)/g);
			if (models.includes("type")) return client[botNum].reply({ from, quoted: message }, `powered by Textpro.me\n\n${dataJSON.map((v, i) => `${i + 1}. ${v.effectName}`).join("\n")}`);
			models =
				models.length == 0
					? [randomize(dataJSON).url]
					: jsSplit
							.select(
								dataJSON,
								models.map((v) => Number(v) - 1),
							)
							.map((v) => v.url);
			if (models.length == 0) return client[botNum].reply({ from, quoted: message }, `Model ${models[0]} not found\n Type : !${this.name} -type`);
			for (const model of models) {
				const result = await textpro(model, parsed.join(" "));
				await client[botNum].sendMessage(from, { image: { url: result.dl } });
			}
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
