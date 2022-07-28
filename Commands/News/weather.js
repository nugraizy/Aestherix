import { getWeather } from "../../Utils/News/index.js";

export default {
	name: "weather",
	description: "Get Weather on Your City",
	usage: "!weather <query>",
	category: "News",
	aliases: ["cuaca"],
	limit: 1,
	cooldown: 5,
	status: "enable",
	async run({ query, args, from, message, mediaData, extractMediaData, typeQuoted }, client) {
		if (typeQuoted !== "locationMessage" && typeQuoted !== "liveLocationMessage" && !query) return await client[botNum].reply({ from, quoted: message }, "Please, input city name\nEx:\n*!weather Bekasi* or reply to location message");
		try {
			const info = typeQuoted == "locationMessage" || typeQuoted == "liveLocationMessage" ? await getWeather("coordinate", extractMediaData.degreesLatitude, extractMediaData.degreesLongitude) : await getWeather("city", query);
			if ("error" in info) return await client[botNum].reply({ from, quoted: message }, info.error);
			const text = ` ~> ${info.name}\n
Description : ${info.desc.capitalize()}
Temperature : ${info.temp}
Feels like : ${info.feels}
Pressure : ${info.press}
Humidity : ${info.humi}
Visibility : ${info.visible}
Wind Speed : ${info.wind}\n
Powered by openweathermap.org`;
			await client[botNum].sendMessage(
				from,
				{
					text: `\`\`\` • ${info.emoji} Weather Report ${info.emoji} \`\`\``,
					templateButtons: [{ urlButton: { displayText: "More Info", url: `More info https://openweathermap.org/city/${info.id}` } }],
					footer: text.trim(),
				},
				{ quoted: message },
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
