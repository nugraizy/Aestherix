import { getWeather } from '../../utils/news/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'weather',
	minifiedDescription: 'Get Weather',
	description: 'Get Weather on Your City.',
	usage: '!weather <query>',
	category: 'News',
	aliases: ['cuaca'],
	limit: 1,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, extractMediaData, typeQuoted, groupMetadata }, client) {
		if (typeQuoted !== 'locationMessage' && typeQuoted !== 'liveLocationMessage' && !query) {
			return await client.instance.reply('Please, input city name\nEx:\n*!weather Bekasi* or reply to location message', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		const info =
			typeQuoted === 'locationMessage' || typeQuoted === 'liveLocationMessage'
				? await getWeather('coordinate', extractMediaData.degreesLatitude, extractMediaData.degreesLongitude)
				: await getWeather('city', query);

		if ('error' in info) {
			return await client.instance.reply(info.error, {
				from,
				quoted: message,
				groupMetadata
			});
		}

		const text = ` ~> ${info.name}\n
Description : ${info.desc.capitalize()}
Temperature : ${info.temp}
Feels like : ${info.feels}
Pressure : ${info.press}
Humidity : ${info.humi}
Visibility : ${info.visible}
Wind Speed : ${info.wind}\n
Powered by openweathermap.org`;

		await client.instance.send(
			from,
			{
				text: `${info.emoji} Weather Report ${info.emoji}`.formatHeaders() + `\n\n${text.trim()}`
				// templateButtons: [
				// 	{ urlButton: { displayText: 'More Info', url: `More info https://openweathermap.org/city/${info.id}` } }
				// ],
				// footer: text.trim()
			},
			{ groupMetadata, quoted: message }
		);
	}
};
