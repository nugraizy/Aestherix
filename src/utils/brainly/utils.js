/**
 * Available languages definition.
 * @typedef {('id'|'us'|'es'|'ru'|'ro'|'pt'|'tr'|'ph'|'pl'|'hi'|undefined)} languages
 */
export const LANG = ['id', 'us', 'es', 'ru', 'ro', 'pt', 'tr', 'ph', 'pl', 'hi'];

export const parseAnswers = (arr) =>
	arr.map((item) => ({
		pertanyaan: item.pertanyaan,
		jawaban: item.jawaban.map((answer) => answer.text.replace('amp;', ''))
	}));
