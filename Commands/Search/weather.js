import { openWeatherAPI } from "../../Utils/Open Weather/index.js";

export default {
    name: "weather",
    description: "Get Weather on Your City",
    usage: "!weather <City>",
    category: "Search",
    aliases: ["cuaca"],
    limit: 1,
    cooldown: 5,
    status: "enable",
    async run({
        query,
        args,
        from,
        message,
        mediaData
    }, client) {
        if (!mediaData?.message?.locationMessage && !mediaData?.message?.liveLocationMessage && !query ) return await client[botNum].reply({ from, quoted: message }, "Please, input city name\nEx:\n*!weather Bekasi* or reply to location message"); 
        try {
            if (mediaData?.message?.locationMessage) {
                let geo = mediaData?.message?.locationMessage?.degreesLatitude +
                "|" +
                mediaData?.message?.locationMessage?.degreesLongitude;
                let info = await openWeatherAPI(geo, "geo");
                if (info.status !== 200) return await client[botNum].reply({ from, quoted: message }, info.message); 
                else {
                    let text = `☁️ Weather Report ☁️\n> ${info.name}\n\n` +
                    `\`\`\`Deskripsi/Desc: ${info.desc}\nSuhu/Temp: ${info.temp}\nTerasa/Feels like: ${info.feels}\nTekanan/Pressure: ${info.press}\nKelembaban/Humidity: ${info.humi}\n` +
                    `Jarak Pandang/Visibility: ${info.visible}\nKecepatan Angin/Wind Speed: ${info.wind}\`\`\`` +
                    `\n\n*Powered by* openweathermap.org\nMore https://openweathermap.org/city/${info.id}`;
                    await client[botNum].reply({ from, quoted: message }, text); 
                }
            } else if (mediaData?.message?.liveLocationMessage) {
                let geo = mediaData?.message?.liveLocationMessage?.degreesLatitude +
                "|" +
                mediaData?.message?.liveLocationMessage?.degreesLongitude;
                let info = await openWeatherAPI(geo, "geo");
                if (info.status !== 200) return await client[botNum].reply({ from, quoted: message }, info.message); 
                else {
                    let text = `☁️ Weather Report ☁️\n> ${info.name}\n\n` +
                    `\`\`\`Deskripsi/Desc: ${info.desc}\nSuhu/Temp: ${info.temp}\nTerasa/Feels like: ${info.feels}\nTekanan/Pressure: ${info.press}\nKelembaban/Humidity: ${info.humi}\n` +
                    `Jarak Pandang/Visibility: ${info.visible}\nKecepatan Angin/Wind Speed: ${info.wind}\`\`\`` +
                    `\n\n*Powered by* openweathermap.org\nMore https://openweathermap.org/city/${info.id}`;
                    await client[botNum].reply({ from, quoted: message }, text); 
                }
            } else {
                let info = await openWeatherAPI(query, "city");
                if (info.status !== 200 ) return await client[botNum].reply({ from, quoted: message }, info.message); 
                else {
                    let text =
						`☁️ Weather Report ☁️\n> ${info.name}\n\n` +
						`\`\`\`Deskripsi/Desc: ${info.desc}\nSuhu/Temp: ${info.temp}\nTerasa/Feels like: ${info.feels}\nTekanan/Pressure: ${info.press}\nKelembaban/Humidity: ${info.humi}\n` +
						`Jarak Pandang/Visibility: ${info.visible}\nKecepatan Angin/Wind Speed: ${info.wind}\`\`\`` +
						`\n\n*Powered by* openweathermap.org\nMore https://openweathermap.org/city/${info.id}`;
                        await client[botNum].reply({ from, quoted: message }, text); 

                }
            }
        } catch (err) {
            let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `\`\`\`• Type Error :\`\`\` *${err.name}*\n`;
			str += `\`\`\`• Message Error :\`\`\` *${err.message}*`;
			str += "\n\nJika Error Terus Menerus, Segera Lapor Ke Owner Bot untuk di perbaiki```\n*⚠ Dan Jangan Lupa Screenshot Errornya.*"
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
        }
    }
}