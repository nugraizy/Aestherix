import Brainly from 'brainly-scraper-v2';

/**
 * Available languages definition.
 * @typedef {('id'|'us'|'es'|'ru'|'ro'|'pt'|'tr'|'ph'|'pl'|'hi'|undefined)} languages
 */
const LANG = ['id', 'us', 'es', 'ru', 'ro', 'pt', 'tr', 'ph', 'pl', 'hi'];

const parseAnswers = (arr) =>
	arr.map((item) => ({
		pertanyaan: item.pertanyaan,
		jawaban: item.jawaban.map((answer) => answer.text.replace('amp;', '')),
	}));

/**
 * Parsed result definition.
 * @typedef {{pertanyaan: string, jawaban: string[]}[] & {error?: string}} ResultsBrainly
 */

/**
 * Search Questions/Homework answers in Brainly/
 * @param {string} query keyword of the questions to search using Brainly module.
 * @param {{lang: languages, count: number}} options set options. [lang='id', count=5].
 * @returns {Promise<ResultsBrainly>}
 * @throws {Promise<Error>}
 */
export const brainlySearch = (query, options) =>
	new Promise(async (resolve, reject) => {
		try {
			if (!options.lang) {
				options.lang = 'id';
			}

			if (!options.count) {
				options.count = 5;
			}

			const { count, lang } = options;

			if (count > 30) {
				resolve({ error: 'Max count is 30' });
			}

			if (count === 0) {
				resolve({ error: 'Count cannot be 0' });
			}

			if (!LANG.includes(lang)) {
				resolve({
					error: `Language not supported\n\nChoose either of one of this : ${LANG.join(
						', ',
					)} or leave it blank. (Indonesia will be used)`,
				});
			}

			const { data } = await Brainly(query, count, lang);

			resolve(parseAnswers(data));
		} catch (err) {
			reject(err);
		}
	});
