import axios from 'axios';
import cheerio from 'cheerio';

const _api = 'https://www.fanbolt.com/anime-name-generator/';

export const animeNameOptions = {
	boy: 117395,
	boyWithMeanings: 117391,
	cool: 117393,
	girl: 117394,
	girlWithMeanings: 117390,
	modern: 117392,
};

export const animeName = (input, type) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data: dataSecret } = await axios.get(_api);
			let $ = cheerio.load(dataSecret);
			const secret = $('#ug-secret').val();

			const { data } = await axios(_api, {
				method: 'POST',
				data: `ug-secret=${secret}&_wp_http_referer=%2Fanime-name-generator%2F&ug-select%5B%5D=${animeNameOptions[type]}&ug-input-name=${input}`,
				headers: {
					'user-agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
					'content-type': 'application/x-www-form-urlencoded',
				},
			});

			$ = cheerio.load(data);

			resolve(
				$('.ug-nicknames')
					.find('p')
					.map((v, el) => {
						const rawData = $(el).text().trim();
						const isMeaning = rawData.includes('–');
						const name = isMeaning ? rawData.split('–')[0].trim() : rawData;
						const meaning = isMeaning ? rawData.split('–')[1].trim() : null;

						return {
							name,
							meaning,
						};
					})
					.get(),
			);
		} catch (error) {
			reject(error);
		}
	});
