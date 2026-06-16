import { useLocale } from '../../../helper/i18n/index.js';

export const getCategories = (locale) => {
	const T = useLocale(locale, 'trivia');

	return {
		SCIENCE: T.categories.SCIENCE,
		HISTORY: T.categories.HISTORY,
		GEOGRAPHY: T.categories.GEOGRAPHY,
		ENTERTAINMENT: T.categories.ENTERTAINMENT,
		SPORTS: T.categories.SPORTS,
		TECHNOLOGY: T.categories.TECHNOLOGY,
		NATURE: T.categories.NATURE,
		GENERAL: T.categories.GENERAL,
		MYTHOLOGY: T.categories.MYTHOLOGY,
		ART: T.categories.ART,
		VEHICLES: T.categories.VEHICLES,
		BOOKS: T.categories.BOOKS,
		MUSIC: T.categories.MUSIC,
		TELEVISION: T.categories.TELEVISION,
		VIDEOGAMES: T.categories.VIDEOGAMES,
		BOARDGAMES: T.categories.BOARDGAMES,
		MATHEMATICS: T.categories.MATHEMATICS,
		POLITICS: T.categories.POLITICS,
		CELEBRITIES: T.categories.CELEBRITIES,
		COMICS: T.categories.COMICS,
		ANIME: T.categories.ANIME,
		CARTOONS: T.categories.CARTOONS
	};
};

export const getQuestions = (locale) => {
	const T = useLocale(locale, 'trivia');
	const questions = T.questions;

	if (!Array.isArray(questions)) {
		return [];
	}

	const categories = getCategories(locale);

	return questions.map((q) => ({
		...q,
		categoryName: categories[q.category] || q.category
	}));
};

export const getCategoryQuestionsCount = (locale, category) => {
	const questions = getQuestions(locale);

	return questions.filter((q) => q.category === category).length;
};
