import { generateMessageID } from "@adiwajshing/baileys";
import { convertSecondstoTime, numberWithCommas } from "../../Helper/index.js";
import { MyAnimeList } from "../../Utils/MyAnimeList/index.js";

export default {
	name: "malanimeranking",
	description: "Looks for Top Ranked Anime on MyAnimeList.",
	usage: "!malanimeranking <type>",
	category: "Anime",
	aliases: ["malanimrank"],
	limit: 2,
	cooldown: 2,
	status: "enable",
	async run({ query, from, message, args, type, cmd }, client) {
		try {
			const mal = new MyAnimeList();
			if (args[1] == "detail" && type == "listResponseMessage") {
				const detail = await mal.getAnimeDetail(args[2]);
				if ("error" in detail) {
					return client[botNum].reply({ from, quoted: message }, detail.message);
				}
				const caption = parse(detail);
				const {
					id,
					main_picture: { large, medium },
				} = detail;
				return await client[botNum].sendMessage(
					from,
					{
						image: { url: large },
						caption: `\`\`\` • Myanimelist Ranking [ Anime ]\`\`\`\n\n${caption.trim()}`,
						footer: "Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
						templateButtons: [
							{ urlButton: { displayText: "Myanimelist Source", url: `https://www.myanimelist.net/anime/${id}` } },
							{ urlButton: { displayText: "Image HD Source", url: large } },
							{ urlButton: { displayText: "Image SD Source", url: medium } },
						],
					},
					{ quoted: message },
				);
			}
			const result = await mal.getAnimeRanking(query || undefined);
			if ("error" in result) {
				return client[botNum].reply({ from, quoted: message }, result.message);
			}
			const rows = result
				.map(({ title, id }, i) => {
					if (i !== 0) {
						return { rows: [{ title: `[ ${i + 1} ] ${title}`, rowId: `${cmd} detail ${id}` }], title: `\t` };
					}
				})
				.filter(Boolean);
			const caption = parse(result[0]);
			const {
				id,
				main_picture: { large, medium },
			} = result[0];
			await client[botNum].sendMessage(
				from,
				{
					image: { url: large },
					caption: `\`\`\` • Myanimelist Ranking [ Anime ]\`\`\`\n\n${caption.trim()}`,
					footer: "Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
					templateButtons: [
						{ urlButton: { displayText: "Myanimelist Source", url: `https://www.myanimelist.net/anime/${id}` } },
						{ urlButton: { displayText: "Image HD Source", url: large } },
						{ urlButton: { displayText: "Image SD Source", url: medium } },
					],
				},
				{ quoted: message },
			);
			await client[botNum].relayMessage(
				from,
				{
					listMessage: {
						buttonText: "``` • Myanimelist Ranking [ Anime ]```",
						description: "Myanimelist Ranking",
						footerText: "choose one of the title inside of the list to see the details of the anime.",
						listType: 1,
						sections: rows,
					},
				},
				{ messageId: generateMessageID() },
			);
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};

const parse = (obj) => {
	return `Full Title : ${obj?.title || "N/A"}
EN : ${obj?.alternative_titles?.en || "N/A"}
JP : ${obj?.alternative_titles?.ja || "N/A"}
ID : ${obj?.id || "N/A"}

Rank : ${obj?.rank || "N/A"}
Score : ${obj?.score || "N/A"}
Popularity : ${obj?.popularity || "N/A"}
Tot. Listed Users : ${numberWithCommas(obj?.num_list_users || 0)}
Tot. Scoring Users : ${numberWithCommas(obj?.num_scoring_users || 0)}
NSFW? : ${obj?.nsfw == "white" ? "No" : "Yes"}
Anime Type : ${obj?.media_type?.capitalize() || "N/A"}
Status : ${obj?.status?.replace("_", " ")?.capitalize() || "N/A"}
Tot. Episodes : ${numberWithCommas(obj?.num_episodes || 0)}
Start Broadcasting : ${obj?.broadcast?.start_time || "N/A"} ${obj?.broadcast?.day_of_the_week?.capitalize() || "N/A"} ${obj?.start_season.season?.capitalize() || "N/A"} ${
		obj?.start_season?.year || "N/A"
	}
Source : ${obj?.source?.replace("_", "")?.capitalize()}
AVG. Duration per Episode : ${convertSecondstoTime(obj?.average_episode_duration * 1000 || 0)}
Rating : ${obj?.rating?.replace("_", " ")?.capitalize() || "N/A"}
Studios : ${obj?.studios?.map(({ name }) => name)?.join(", ") || "N/A"}
Genres : ${obj?.genres?.map(({ name }) => name)?.join(", ") || "N/A"}
	
Synopsis : ${obj?.synopsis || "N/A"}`;
};
