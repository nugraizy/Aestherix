import { fetchJSON } from '../modules/index.js';

const EMOJIS = {
	'01d': '☀️',
	'02d': '⛅️',
	'03d': '☁️',
	'04d': '☁️',
	'09d': '\uD83C\uDF27',
	'10d': '\uD83C\uDF26',
	'11d': '⛈',
	'13d': '❄️',
	'50d': '\uD83C\uDF2B',
	'01n': '\uD83C\uDF11',
	'02n': '\uD83C\uDF11 ☁',
	'03n': '☁️',
	'04n': '️️☁☁',
	'09n': '\uD83C\uDF27',
	'10n': '☔️',
	'11n': '⛈',
	'13n': '❄️',
	'50n': '\uD83C\uDF2B'
};

const URL_API = (type, ...input) => {
	return {
		coordinate: `https://api.openweathermap.org/data/2.5/weather?lat=${input[0]}&lon=${input[1]}&appid=${process.env.WEATHER_KEY}&units=metric&lang=en`,
		city: `https://api.openweathermap.org/data/2.5/weather?q=${input[0]}&appid=${process.env.WEATHER_KEY}&units=metric&lang=en`
	}[type];
};

export const getWeather = (type, ...q) =>
	new Promise(async (resolve, reject) => {
		try {
			let data;

			const headers = {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36'
			};

			switch (type) {
				case 'coordinate':
					data = await fetchJSON(URL_API(type, q[0], q[1]), { headers });
					break;
				case 'city':
					data = await fetchJSON(URL_API(type, q[0]), { headers });
					break;
				default:
					data = await fetchJSON(URL_API('city', q[0]), { headers });
					break;
			}

			if (data.cod !== 200) {
				return resolve({ error: data?.message });
			}

			resolve({
				desc: data.weather[0].description,
				temp: `${data.main.temp}°C`,
				feels: `${data.main.feels_like}°C`,
				press: `${data.main.pressure} hPa`,
				humi: `${data.main.humidity}%`,
				visible: `${(data.visibility / 1000).toFixed(1)} km`,
				wind: `${data.wind.speed} m/s`,
				name: data.name,
				id: data.id,
				emoji: EMOJIS[data.weather[0].icon]
			});
		} catch (err) {
			log(err);
			reject(err);
		}
	});
