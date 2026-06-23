import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { getWeather } from '../../utils/news/index.js';
import { defineCommand } from '../_define.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default defineCommand({
	name: 'weather',
	minifiedDescription: 'Get Weather',
	description: 'Get Weather on Your City.',
	usage: '!weather `<query>`',
	category: 'News',
	aliases: ['cuaca'],
	limit: 1,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, extractMediaData, typeQuoted }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ln = useLocale(locale, 'news');

		if (typeQuoted !== 'locationMessage' && typeQuoted !== 'liveLocationMessage' && !query) {
			return await client.reply(from, L.errors.queryRequired, message);
		}

		const info =
			typeQuoted === 'locationMessage' || typeQuoted === 'liveLocationMessage'
				? await getWeather('coordinate', extractMediaData.degreesLatitude, extractMediaData.degreesLongitude)
				: await getWeather('city', query);

		if (info?.error) {
			return await client.reply(from, info.error, message);
		}

		const text = ` ~> ${info.name}\n
${Ln.labels.description} : ${info.desc.capitalize()}
${Ln.labels.temperature} : ${info.temp}
${Ln.labels.feelsLike} : ${info.feels}
${Ln.labels.pressure} : ${info.press}
${Ln.labels.humidity} : ${info.humi}
${Ln.labels.visibility} : ${info.visible}
${Ln.labels.windSpeed} : ${info.wind}\n
${Ln.labels.poweredByOwm}`;

		await client.send(
			from,
			{
				text: `${t(locale, 'news.titles.weatherReport', [info.emoji, info.emoji])}`.formatHeaders() + `\n\n${text.trim().formatForm()}`
				// templateButtons: [
				// 	{ urlButton: { displayText: 'More Info', url: `More info https://openweathermap.org/city/${info.id}` } }
				// ],
				// footer: text.trim()
			},
			{ quoted: message }
		);
	}
});
