import { numberWithCommas, removeDuplicatesArray, shuffleArray } from "../../Helper/Modules/index.js";
import { PStoreProduct } from "../../Utils/P-Store/index.js";

export default {
	name: "pstore",
	description: "Search products from p-store",
	usage: "!pstore <query>",
	category: "Search",
	aliases: ["pstor"],
	limit: 4,
	cooldown: 5,
	status: "enable",
	async run({ query, from, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		try {
			let queries = query.split(",");
			queries = removeDuplicatesArray(queries);
			for (const querie of queries) {
				let product = await PStoreProduct(querie.trim());
				if ("error" in product) {
					await client[botNum].reply({ from, quoted: message }, product.error);
					continue;
				}
				const filterProduct = product.filter((v) => regex(querie.trim(), v.name));
				product = filterProduct.length == 0 ? product.slice(0, 5) : filterProduct.slice(0, 5);
				for (const { estimations, idProduct, name, priceFormatted, stock, maxOrder, ratings, sellerUsername, source, thumbnail } of product) {
					await client[botNum].sendMessage(
						from,
						{
							image: { url: thumbnail },
							caption: `\`\`\` • P-Store \`\`\``,
							templateButtons: [
								{
									urlButton: {
										displayText: "Product Source",
										url: source,
									},
								},
								{
									urlButton: {
										displayText: "Image Source",
										url: thumbnail,
									},
								},
							],
							footer: `Name : ${name}
Seller Name : ${sellerUsername}
ID Product : ${idProduct}
Estimations : ${estimations}
Stock : ${numberWithCommas(stock || 0)}
Max Order : ${numberWithCommas(maxOrder)}
Price : ${priceFormatted}
Ratings : ${ratings.toFixed(2)}`,
						},
						{ quoted: message },
					);
				}
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

const regex = (str1, str2) => {
	return new RegExp(`\\b${str1}\\b`).test(str2.toLowerCase());
};
