import { wp_search, wp_latest, wp_download } from "../../Utils/Waifuplay/index.js";
import { generateWAMessageFromContent } from "@adiwajshing/baileys";

export default {
	name: "waifuplay",
    description: "Search Anime or Get Latest Updates from Waifuplay.me.",
	aliases: ["wp"],
	category: "Search",
    cooldown: 3,
	usage: "<option> \n\nOptions:\n- search <title>\nEx: .myanimelist search paripi koumei\n- latest",
	async run({ args, from, message, query, sender }, client) {
		try {
			if (args[1] === "search") {
                wp_search(query.replace("search ","")).then(async (result) => {
                    await client[botNum].reply({ from, quoted: message }, "[ ! ] It's being processed...")
                    await client[botNum].sendMessage(from, { image: { url: result.image || "https://i.stack.imgur.com/6M513.png" }, caption: 
`「 *WAIFUPLAY SEARCH* 」
• *Title :* ${result.title}
• *Score :* ${result.score}
• *Studio :* ${result.studio}
• *Season :* ${result.season}
• *Type :* ${result.type}
• *Genre :* ${result.genre}
• *Url :* ${result.link}`}, { quoted: message })
                    if (result.list_episode.type == 'episode') {
                        let sections = [{ title: "Download Episode", rows: [] }];
                        for (let i = 0; i < result.list_episode.result.length; i++) {
                            sections[0].rows.push({ title: result.list_episode.result[i].episode, rowId: `#waifuplay download ${result.list_episode.result[i].url}` });
                        }
                        await client[botNum].sendMessage(
                            from,
                            {
                                text: "Ingin download episode anime?? Pilih dibawah ini.",
                                buttonText: "Hasil Pencarian",
                                footer: "Eiko [ BOT ]",
                                mentions: [sender],
                                sections,
                            });
                        sections = null;
                        sections = null
                    } else if (result.list_episode.type == 'batch') {
                        let sections = [{ title: "「 *WAIFUPLAY DOWNLOADER* 」", rows: [] }];
                        for (let i = 0; i < result.list_episode.result.length; i++) {
                            sections[0].rows.push({ title: result.list_episode.result[i].quality, rowId: result.list_episode.result[i].url });
                        }
                        await client[botNum].sendMessage(
                            from,
                            {
                                text: "Ingin download episode anime?? Pilih dibawah ini.",
                                buttonText: "Hasil Pencarian",
                                footer: "Eiko [ BOT ]",
                                mentions: [sender],
                                sections,
                            });
                        sections = null;
                    }
                }).catch((e) => {
                    log(e)
                    client[botNum].reply({ from, quoted: message }, "Anime Tidak Ditemukan...")
                })
            } else if (args[1] === "latest") {
                wp_latest().then(async (result) => {
                    await client[botNum].reply({ from, quoted: message }, "[ ! ] It's being processed...")
                    for (let i = 0; i < result.results.length; i++) {
                        let buttons = [
                            { urlButton: { displayText: "Source", url: result.results[i].link } },
                            { quickReplyButton: { displayText: "Download", id: `#waifuplay download ${result.results[i].link}`}},
                        ];
                        await client[botNum].sendMessage(from, { image: { url: result.results[i].image || "https://i.stack.imgur.com/6M513.png" }, caption: 
`「 *WAIFUPLAY LATEST* 」
• *Title :* ${result.results[i].title}
• *Episode :* ${result.results[i].episode}
• *Status :* ${result.results[i].status}
• *Type :* ${result.results[i].type}`,
                                templateButtons: buttons,
                                footer: "Eiko [ BOT ]",
                            },
                            { quoted: message }
                        );
                    }
                }).catch((e) => {
                    console.log(e)
                    client[botNum].reply({ from, quoted: message }, "Terjadi kesalahan")
                })
            } else if (args[1] === "download") {
                wp_download(args[2]).then((result) => {
                    let caption = `「 *WAIFUPLAY DOWNLOADER* 」\n`
                    for (let i = 0; i < result.length; i++) {
                        caption +=
`
• Kualitas : ${result[i].quality}
• Url : ${result[i].url}
`
                    }
                    client[botNum].sendMessage(from, { text: caption }, { quoted: '' })
                })
            } else {
                client[botNum].sendMessage(from, { text: 
`「 *WAIFUPLAY* 」
• .waifuplay search _title_
Ex : .waifuplay search majo no tabi tabi
• .waifuplay latest`}, { quoted: message })
                }
		} catch (e) {
            console.log(e)
			await client[botNum].reply({ from, quoted: message }, "Terjadi kesalahan");
		}
	},
};
