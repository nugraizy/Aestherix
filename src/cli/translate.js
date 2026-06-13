import axios from 'axios';
import fs from 'fs';
import path from 'path';
import querystring from 'querystring';

export class GoogleTranslate {
	constructor(options = {}) {
		this.baseUrl = options.baseUrl || 'https://translate.googleapis.com/translate_a/single';
		this.client = options.client || 'gtx';
		this.TKK = '0';
		this.delay = options.delay || 1000;
		this.maxRetries = options.maxRetries || 3;
		this.headers = {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
			'Accept': '*/*',
			'Accept-Language': 'en-US,en;q=0.9',
			'Referer': 'https://translate.google.com/'
		};
	}

	_sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	_applyHash(t, n) {
		for (let e = 0; e < n.length - 2; e += 3) {
			let a = n.charAt(e + 2);

			a = 'a' <= a ? a.charCodeAt(0) - 87 : Number(a);
			a = '+' === n.charAt(e + 1) ? t >>> a : t << a;
			t = '+' === n.charAt(e) ? (t + a) & 4294967295 : t ^ a;
		}

		return t;
	}

	_encodeUTF8(text) {
		const bytes = [];

		for (let i = 0; i < text.length; i++) {
			let c = text.charCodeAt(i);

			if (c < 128) {
				bytes[bytes.length] = c;
			} else if (c < 2048) {
				bytes[bytes.length] = (c >> 6) | 192;
				bytes[bytes.length] = (63 & c) | 128;
			} else if (55296 === (64512 & c) && i + 1 < text.length && 56320 === (64512 & text.charCodeAt(i + 1))) {
				c = 65536 + ((1023 & c) << 10) + (1023 & text.charCodeAt(++i));
				bytes[bytes.length] = (c >> 18) | 240;
				bytes[bytes.length] = ((c >> 12) & 63) | 128;
				bytes[bytes.length] = ((c >> 6) & 63) | 128;
				bytes[bytes.length] = (63 & c) | 128;
			} else {
				bytes[bytes.length] = (c >> 12) | 224;
				bytes[bytes.length] = ((c >> 6) & 63) | 128;
				bytes[bytes.length] = (63 & c) | 128;
			}
		}

		return bytes;
	}

	_generateToken(text) {
		const tkkParts = this.TKK.split('.');
		const tkkNum = Number(tkkParts[0]) || 0;
		const bytes = this._encodeUTF8(text);

		let hash = tkkNum;

		for (let i = 0; i < bytes.length; i++) {
			hash += bytes[i];
			hash = this._applyHash(hash, '+-a^+6');
		}

		hash = this._applyHash(hash, '+-3^+b+-f');

		hash ^= Number(tkkParts[1]) || 0;

		if (hash < 0) {
			hash = 2147483648 + (2147483647 & hash);
		}

		hash %= 1e6;

		return hash.toString() + '.' + (hash ^ tkkNum);
	}

	async _updateTKK() {
		const hour = Math.floor(Date.now() / 3600000);
		const tkkHour = Number(this.TKK.split('.')[0]);

		if (tkkHour !== hour) {
			try {
				const response = await axios.get('https://translate.google.com', {
					headers: this.headers,
					timeout: 10000
				});
				const match = response.data.match(/tkk:'\d+.\d+'/g);

				if (match && match.length > 0) {
					this.TKK = match[0].split(':')[1].replace(/'/g, '');
				}
			} catch (error) {
				console.error('Failed to update TKK:', error.message);
			}
		}
	}

	async translate(text, options = {}) {
		if (typeof options !== 'object') {
			options = {};
		}

		text = String(text);

		const from = options.from || 'auto';
		const to = options.to || 'en';
		const raw = Boolean(options.raw);
		const skipDelay = Boolean(options.skipDelay);

		if (!skipDelay && this.delay > 0) {
			await this._sleep(this.delay);
		}

		await this._updateTKK();

		const token = this._generateToken(text);
		const params = {
			client: this.client,
			sl: from,
			tl: to,
			hl: to,
			dt: ['at', 'bd', 'ex', 'ld', 'md', 'rw', 'rm', 'ss', 't'],
			ie: 'UTF-8',
			oe: 'UTF-8',
			otf: 1,
			ssel: 0,
			tsel: 0,
			kc: 7,
			q: text,
			tk: token
		};

		let url = this.baseUrl + '?' + querystring.stringify(params);
		let response;

		for (let attempt = 0; attempt < this.maxRetries; attempt++) {
			try {
				if (url.length > 2048) {
					delete params.q;
					const postUrl = this.baseUrl + '?' + querystring.stringify(params);

					response = await axios.post(postUrl, new URLSearchParams({ q: text }).toString(), {
						headers: { ...this.headers, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
						timeout: 15000
					});
				} else {
					response = await axios.get(url, {
						headers: this.headers,
						timeout: 15000
					});
				}

				break;
			} catch (error) {
				if (error.response?.status === 429 && attempt < this.maxRetries - 1) {
					const waitTime = (attempt + 1) * 5000;

					console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
					await this._sleep(waitTime);
					continue;
				}

				throw error;
			}
		}

		const result = response.data;
		const translation = {
			text: '',
			from: {
				language: { didYouMean: false, iso: '' },
				text: { autoCorrected: false, value: '', didYouMean: false }
			},
			raw: ''
		};

		if (raw) {
			translation.raw = result;
		}

		if (result[0]) {
			result[0].forEach((item) => {
				if (item[0]) {
					translation.text += item[0];
				}
			});
		}

		if (result[2] === result[8][0][0]) {
			translation.from.language.iso = result[2];
		} else {
			translation.from.language.didYouMean = true;
			translation.from.language.iso = result[8][0][0];
		}

		if (result[7] && result[7][0]) {
			let text = result[7][0];

			text = text.replace(/<b><i>/g, '[').replace(/<\/i><\/b>/g, ']');
			translation.from.text.value = text;

			if (result[7][5] === true) {
				translation.from.text.autoCorrected = true;
			} else {
				translation.from.text.didYouMean = true;
			}
		}

		return translation;
	}

	async translateBatch(texts, options = {}) {
		const results = [];

		for (let i = 0; i < texts.length; i++) {
			const result = await this.translate(texts[i], options);

			results.push(result);
		}

		return results;
	}

	async generateLanguageFiles(basePath, outputPath, options = {}) {
		const baseTranslate = JSON.parse(fs.readFileSync(path.join(basePath, 'en.json'), 'utf8'));
		const languageList = JSON.parse(fs.readFileSync(path.join(basePath, 'languages.json'), 'utf8'));

		if (!fs.existsSync(outputPath)) {
			fs.mkdirSync(outputPath, { recursive: true });
		}

		const startFrom = options.startFrom || 0;
		const onlyLang = options.onlyLang || null;

		for (let i = startFrom; i < languageList.length; i++) {
			const lang = languageList[i];

			if (lang.iso === 'id') {
				continue;
			}

			if (onlyLang && lang.iso !== onlyLang) {
				continue;
			}

			try {
				const newTranslate = {};

				const translateObj = async (source, target, keyPath = '') => {
					for (const key of Object.keys(source)) {
						const fullPath = keyPath ? `${keyPath}/${key}` : key;

						if (typeof source[key] === 'string') {
							const result = await this.translate(source[key], { from: 'id', to: lang.iso });

							target[key] = result.text;
						} else {
							target[key] = {};
							await translateObj(source[key], target[key], fullPath);
						}
					}
				};

				await translateObj(baseTranslate, newTranslate);

				const outputFile = path.join(outputPath, `${lang.iso}.json`);

				await fs.promises.writeFile(outputFile, JSON.stringify(newTranslate, null, 2));
				console.log(`[${i + 1}/${languageList.length}] Successfully translated to ${lang.lang} (${lang.iso})`);
			} catch (error) {
				console.log(`[${i + 1}/${languageList.length}] Failed to translate to ${lang.lang} (${lang.iso}):`, error.message);
			}
		}
	}

	async getSupportedLanguages() {
		return [
			{ iso: 'af', lang: 'Afrikaans' },
			{ iso: 'sq', lang: 'Albanian' },
			{ iso: 'am', lang: 'Amharic' },
			{ iso: 'ar', lang: 'Arabic' },
			{ iso: 'hy', lang: 'Armenian' },
			{ iso: 'az', lang: 'Azerbaijani' },
			{ iso: 'eu', lang: 'Basque' },
			{ iso: 'be', lang: 'Belarusian' },
			{ iso: 'bn', lang: 'Bengali' },
			{ iso: 'bs', lang: 'Bosnian' },
			{ iso: 'bg', lang: 'Bulgarian' },
			{ iso: 'ca', lang: 'Catalan' },
			{ iso: 'ceb', lang: 'Cebuano' },
			{ iso: 'zh-CN', lang: 'Chinese (Simplified)' },
			{ iso: 'zh-TW', lang: 'Chinese (Traditional)' },
			{ iso: 'co', lang: 'Corsican' },
			{ iso: 'hr', lang: 'Croatian' },
			{ iso: 'cs', lang: 'Czech' },
			{ iso: 'da', lang: 'Danish' },
			{ iso: 'nl', lang: 'Dutch' },
			{ iso: 'en', lang: 'English' },
			{ iso: 'eo', lang: 'Esperanto' },
			{ iso: 'et', lang: 'Estonian' },
			{ iso: 'fi', lang: 'Finnish' },
			{ iso: 'fr', lang: 'French' },
			{ iso: 'fy', lang: 'Frisian' },
			{ iso: 'gl', lang: 'Galician' },
			{ iso: 'ka', lang: 'Georgian' },
			{ iso: 'de', lang: 'German' },
			{ iso: 'el', lang: 'Greek' },
			{ iso: 'gu', lang: 'Gujarati' },
			{ iso: 'ht', lang: 'Haitian Creole' },
			{ iso: 'ha', lang: 'Hausa' },
			{ iso: 'haw', lang: 'Hawaiian' },
			{ iso: 'he', lang: 'Hebrew' },
			{ iso: 'hi', lang: 'Hindi' },
			{ iso: 'hmn', lang: 'Hmong' },
			{ iso: 'hu', lang: 'Hungarian' },
			{ iso: 'is', lang: 'Icelandic' },
			{ iso: 'ig', lang: 'Igbo' },
			{ iso: 'id', lang: 'Indonesian' },
			{ iso: 'ga', lang: 'Irish' },
			{ iso: 'it', lang: 'Italian' },
			{ iso: 'ja', lang: 'Japanese' },
			{ iso: 'jv', lang: 'Javanese' },
			{ iso: 'kn', lang: 'Kannada' },
			{ iso: 'kk', lang: 'Kazakh' },
			{ iso: 'km', lang: 'Khmer' },
			{ iso: 'rw', lang: 'Kinyarwanda' },
			{ iso: 'ko', lang: 'Korean' },
			{ iso: 'ku', lang: 'Kurdish' },
			{ iso: 'ky', lang: 'Kyrgyz' },
			{ iso: 'lo', lang: 'Lao' },
			{ iso: 'la', lang: 'Latin' },
			{ iso: 'lv', lang: 'Latvian' },
			{ iso: 'lt', lang: 'Lithuanian' },
			{ iso: 'lb', lang: 'Luxembourgish' },
			{ iso: 'mk', lang: 'Macedonian' },
			{ iso: 'mg', lang: 'Malagasy' },
			{ iso: 'ms', lang: 'Malay' },
			{ iso: 'ml', lang: 'Malayalam' },
			{ iso: 'mt', lang: 'Maltese' },
			{ iso: 'mi', lang: 'Maori' },
			{ iso: 'mr', lang: 'Marathi' },
			{ iso: 'mn', lang: 'Mongolian' },
			{ iso: 'my', lang: 'Myanmar (Burmese)' },
			{ iso: 'ne', lang: 'Nepali' },
			{ iso: 'no', lang: 'Norwegian' },
			{ iso: 'ny', lang: 'Nyanja (Chichewa)' },
			{ iso: 'or', lang: 'Odia (Oriya)' },
			{ iso: 'ps', lang: 'Pashto' },
			{ iso: 'fa', lang: 'Persian' },
			{ iso: 'pl', lang: 'Polish' },
			{ iso: 'pt', lang: 'Portuguese' },
			{ iso: 'pa', lang: 'Punjabi' },
			{ iso: 'ro', lang: 'Romanian' },
			{ iso: 'ru', lang: 'Russian' },
			{ iso: 'sm', lang: 'Samoan' },
			{ iso: 'gd', lang: 'Scots Gaelic' },
			{ iso: 'sr', lang: 'Serbian' },
			{ iso: 'st', lang: 'Sesotho' },
			{ iso: 'sn', lang: 'Shona' },
			{ iso: 'sd', lang: 'Sindhi' },
			{ iso: 'si', lang: 'Sinhala' },
			{ iso: 'sk', lang: 'Slovak' },
			{ iso: 'sl', lang: 'Slovenian' },
			{ iso: 'so', lang: 'Somali' },
			{ iso: 'es', lang: 'Spanish' },
			{ iso: 'su', lang: 'Sundanese' },
			{ iso: 'sw', lang: 'Swahili' },
			{ iso: 'sv', lang: 'Swedish' },
			{ iso: 'tl', lang: 'Tagalog (Filipino)' },
			{ iso: 'tg', lang: 'Tajik' },
			{ iso: 'ta', lang: 'Tamil' },
			{ iso: 'tt', lang: 'Tatar' },
			{ iso: 'te', lang: 'Telugu' },
			{ iso: 'th', lang: 'Thai' },
			{ iso: 'tr', lang: 'Turkish' },
			{ iso: 'tk', lang: 'Turkmen' },
			{ iso: 'uk', lang: 'Ukrainian' },
			{ iso: 'ur', lang: 'Urdu' },
			{ iso: 'ug', lang: 'Uyghur' },
			{ iso: 'uz', lang: 'Uzbek' },
			{ iso: 'vi', lang: 'Vietnamese' },
			{ iso: 'cy', lang: 'Welsh' },
			{ iso: 'xh', lang: 'Xhosa' },
			{ iso: 'yi', lang: 'Yiddish' },
			{ iso: 'yo', lang: 'Yoruba' },
			{ iso: 'zu', lang: 'Zulu' }
		];
	}
}
