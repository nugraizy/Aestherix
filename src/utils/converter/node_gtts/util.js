import { Cache } from '../../../helper/modules/cache.js';

export const caches = {
	uberduck: new Cache(),
	tiktok: new Cache()
};

export const _apiUberduck = 'https://api.uberduck.ai/speak';
export const _apiTiktok = (text, voice) =>
	`https://api16-va.tiktokv.com/media/api/text/speech/invoke/?speaker_map_type=0&aid=1233&req_text=${text}&text_speaker=${voice}`;

export const VOICES = {
	DISNEY: {
		disney_ghost: 'en_us_ghostface', // eslint-disable-line
		disney_chewbacca: 'en_us_chewbacca', // eslint-disable-line
		disney_c3po: 'en_us_c3po', // eslint-disable-line
		disney_stitch: 'en_us_stitch', // eslint-disable-line
		disney_storm_trooper: 'en_us_stormtrooper', // eslint-disable-line
		disney_rocket: 'en_us_rocket' // eslint-disable-line
	},
	ENGLISH: {
		english_australian_f: 'en_au_001', // eslint-disable-line
		english_australian_m: 'en_au_002', // eslint-disable-line
		english_uk_m_1: 'en_uk_001', // eslint-disable-line
		english_uk_m_2: 'en_uk_003', // eslint-disable-line
		english_us_f_1: 'en_us_001', // eslint-disable-line
		english_us_f_2: 'en_us_002', // eslint-disable-line
		english_us_m_1: 'en_us_006', // eslint-disable-line
		english_us_m_2: 'en_us_007', // eslint-disable-line
		english_us_m_3: 'en_us_009', // eslint-disable-line
		english_us_m_4: 'en_us_010' // eslint-disable-line
	},
	EUROPE: {
		europe_french_m_1: 'fr_001', // eslint-disable-line
		europe_french_m_2: 'fr_002', // eslint-disable-line
		europe_german_f: 'de_001', // eslint-disable-line
		europe_german_m: 'de_002', // eslint-disable-line
		europe_spanish_m: 'es_002' // eslint-disable-line
	},
	AMERICA: {
		america_mexican_m: 'es_mx_002', // eslint-disable-line
		america_portuguese_f_1: 'br_001', // eslint-disable-line
		america_portuguese_f_2: 'br_003', // eslint-disable-line
		america_portuguese_f_2: 'br_004', // eslint-disable-line
		america_portuguese_m: 'br_005' // eslint-disable-line
	},
	ASIA: {
		asia_indonesian_f: 'id_001', // eslint-disable-line
		asia_japanese_f_1: 'jp_001', // eslint-disable-line
		asia_japanese_f_2: 'jp_003', // eslint-disable-line
		asia_japanese_f_3: 'jp_005', // eslint-disable-line
		asia_japanese_m: 'jp_006', // eslint-disable-line
		asia_korean_f: 'kr_003', // eslint-disable-line
		asia_korean_m_1: 'kr_002', // eslint-disable-line
		asia_korean_m_2: 'kr_004' // eslint-disable-line
	},
	SINGING: {
		singing_alto: 'en_female_f08_salut_damour', // eslint-disable-line
		singing_tenor: 'en_male_m03_lobby', // eslint-disable-line
		singing_warm_breeze: 'en_female_f08_warmy_breeze', // eslint-disable-line
		singing_sunshine_soon: 'en_male_m03_sunshine_soon' // eslint-disable-line
	},
	OTHER: {
		misc_narrator: 'en_male_narration', // eslint-disable-line
		misc_wack: 'en_male_funny', // eslint-disable-line
		misc_peace: 'en_female_emotional' // eslint-disable-line
	}
};

export const LANGUAGES = {
	af: 'Afrikaans',
	sq: 'Albanian',
	ar: 'Arabic',
	hy: 'Armenian',
	ca: 'Catalan',
	zh: 'Chinese',
	'zh-cn': 'Chinese (Mandarin/China)',
	'zh-tw': 'Chinese (Mandarin/Taiwan)',
	'zh-yue': 'Chinese (Cantonese)',
	hr: 'Croatian',
	cs: 'Czech',
	da: 'Danish',
	nl: 'Dutch',
	en: 'English',
	'en-au': 'English (Australia)',
	'en-uk': 'English (United Kingdom)',
	'en-us': 'English (United States)',
	eo: 'Esperanto',
	fi: 'Finnish',
	fr: 'French',
	de: 'German',
	el: 'Greek',
	ht: 'Haitian Creole',
	hi: 'Hindi',
	hu: 'Hungarian',
	is: 'Icelandic',
	id: 'Indonesian',
	it: 'Italian',
	ja: 'Japanese',
	ko: 'Korean',
	la: 'Latin',
	lv: 'Latvian',
	mk: 'Macedonian',
	no: 'Norwegian',
	pl: 'Polish',
	pt: 'Portuguese',
	'pt-br': 'Portuguese (Brazil)',
	ro: 'Romanian',
	ru: 'Russian',
	sr: 'Serbian',
	sk: 'Slovak',
	es: 'Spanish',
	'es-es': 'Spanish (Spain)',
	'es-us': 'Spanish (United States)',
	sw: 'Swahili',
	sv: 'Swedish',
	ta: 'Tamil',
	th: 'Thai',
	tr: 'Turkish',
	vi: 'Vietnamese',
	cy: 'Welsh'
};
