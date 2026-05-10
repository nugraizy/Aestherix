import { fetch } from 'undici';

/**
 * @typedef {import('./types/comix').ComixFilters} ComixFilters
 * @typedef {import('./types/comix').ComixListOptions} ComixListOptions
 * @typedef {import('./types/comix').ComixChaptersOptions} ComixChaptersOptions
 * @typedef {import('./types/comix').MangaInput} MangaInput
 * @typedef {import('./types/comix').ChapterInput} ChapterInput
 * @typedef {import('./types/comix').ComixPoster} ComixPoster
 * @typedef {import('./types/comix').ComixManga} ComixManga
 * @typedef {import('./types/comix').ComixChapter} ComixChapter
 * @typedef {import('./types/comix').ComixPage} ComixPage
 * @typedef {import('./types/comix').PageInfo} PageInfo
 * @typedef {import('./types/comix').PosterQuality} PosterQuality
 */

class ComixUtils {
	static get API_BASE() {
		return 'https://comix.to/api/v1';
	}

	static get WEB_BASE() {
		return 'https://comix.to';
	}

	static get DEFAULT_LIMIT() {
		return 28;
	}

	static get NSFW_GENRE_IDS() {
		return ['87264', '8', '87265', '13', '87266', '87268'];
	}

	static get SORT_OPTIONS() {
		return [
			{ label: 'Best Match', value: 'relevance' },
			{ label: 'Latest update', value: 'chapter_updated_at' },
			{ label: 'Recently added', value: 'created_at' },
			{ label: 'Title', value: 'title' },
			{ label: 'Year', value: 'year' },
			{ label: 'Highest rated', value: 'score' },
			{ label: 'Most viewed - 7 days', value: 'views_7d' },
			{ label: 'Most viewed - 30 days', value: 'views_30d' },
			{ label: 'Most viewed - 90 days', value: 'views_90d' },
			{ label: 'Most viewed - all time', value: 'views_total' },
			{ label: 'Most followed', value: 'follows_total' }
		];
	}

	static get STATUS_OPTIONS() {
		return [
			{ label: 'Finished', value: 'finished' },
			{ label: 'Releasing', value: 'releasing' },
			{ label: 'On Hiatus', value: 'on_hiatus' },
			{ label: 'Discontinued', value: 'discontinued' },
			{ label: 'Not Yet Released', value: 'not_yet_released' }
		];
	}

	static get TYPE_OPTIONS() {
		return [
			{ label: 'Manga', value: 'manga' },
			{ label: 'Manhwa', value: 'manhwa' },
			{ label: 'Manhua', value: 'manhua' },
			{ label: 'Other', value: 'other' }
		];
	}

	static get DEMOGRAPHIC_OPTIONS() {
		return [
			{ label: 'Shoujo', value: '1' },
			{ label: 'Shounen', value: '2' },
			{ label: 'Josei', value: '3' },
			{ label: 'Seinen', value: '4' }
		];
	}

	static get GENRE_OPTIONS() {
		return [
			{ label: 'Action', value: '6' },
			{ label: 'Adult', value: '87264' },
			{ label: 'Adventure', value: '7' },
			{ label: 'Boys Love', value: '8' },
			{ label: 'Comedy', value: '9' },
			{ label: 'Crime', value: '10' },
			{ label: 'Drama', value: '11' },
			{ label: 'Ecchi', value: '87265' },
			{ label: 'Fantasy', value: '12' },
			{ label: 'Girls Love', value: '13' },
			{ label: 'Hentai', value: '87266' },
			{ label: 'Historical', value: '14' },
			{ label: 'Horror', value: '15' },
			{ label: 'Isekai', value: '16' },
			{ label: 'Magical Girls', value: '17' },
			{ label: 'Mature', value: '87267' },
			{ label: 'Mecha', value: '18' },
			{ label: 'Medical', value: '19' },
			{ label: 'Mystery', value: '20' },
			{ label: 'Philosophical', value: '21' },
			{ label: 'Psychological', value: '22' },
			{ label: 'Romance', value: '23' },
			{ label: 'Sci-Fi', value: '24' },
			{ label: 'Slice of Life', value: '25' },
			{ label: 'Smut', value: '87268' },
			{ label: 'Sports', value: '26' },
			{ label: 'Superhero', value: '27' },
			{ label: 'Thriller', value: '28' },
			{ label: 'Tragedy', value: '29' },
			{ label: 'Wuxia', value: '30' },
			{ label: 'Aliens', value: '31' },
			{ label: 'Animals', value: '32' },
			{ label: 'Cooking', value: '33' },
			{ label: 'Cross Dressing', value: '34' },
			{ label: 'Delinquents', value: '35' },
			{ label: 'Demons', value: '36' },
			{ label: 'Genderswap', value: '37' },
			{ label: 'Ghosts', value: '38' },
			{ label: 'Gyaru', value: '39' },
			{ label: 'Harem', value: '40' },
			{ label: 'Incest', value: '41' },
			{ label: 'Loli', value: '42' },
			{ label: 'Mafia', value: '43' },
			{ label: 'Magic', value: '44' },
			{ label: 'Martial Arts', value: '45' },
			{ label: 'Military', value: '46' },
			{ label: 'Monster Girls', value: '47' },
			{ label: 'Monsters', value: '48' },
			{ label: 'Music', value: '49' },
			{ label: 'Ninja', value: '50' },
			{ label: 'Office Workers', value: '51' },
			{ label: 'Police', value: '52' },
			{ label: 'Post-Apocalyptic', value: '53' },
			{ label: 'Reincarnation', value: '54' },
			{ label: 'Reverse Harem', value: '55' },
			{ label: 'Samurai', value: '56' },
			{ label: 'School Life', value: '57' },
			{ label: 'Shota', value: '58' },
			{ label: 'Supernatural', value: '59' },
			{ label: 'Survival', value: '60' },
			{ label: 'Time Travel', value: '61' },
			{ label: 'Traditional Games', value: '62' },
			{ label: 'Vampires', value: '63' },
			{ label: 'Video Games', value: '64' },
			{ label: 'Villainess', value: '65' },
			{ label: 'Virtual Reality', value: '66' },
			{ label: 'Zombies', value: '67' }
		];
	}

	/**
	 * @param {boolean} includeOlder
	 * @returns {Array<{ label: string, value: string }>}
	 */
	static buildYears(includeOlder) {
		const currentYear = new Date().getFullYear();
		const years = [];

		for (let year = currentYear; year >= 1990; year -= 1) {
			years.push({ label: String(year), value: String(year) });
		}

		if (includeOlder) {
			years.push({ label: 'Older', value: 'older' });
		}

		return years;
	}

	/**
	 * @param {URLSearchParams} params
	 * @param {string} key
	 * @param {unknown} value
	 */
	static appendParam(params, key, value) {
		if (value === undefined || value === null) {
			return;
		}

		if (Array.isArray(value)) {
			value.forEach((item) => ComixUtils.appendParam(params, key, item));
			return;
		}

		const stringValue = String(value);

		if (stringValue.length === 0) {
			return;
		}

		params.append(key, stringValue);
	}

	/**
	 * @param {URLSearchParams} params
	 * @param {ComixFilters} filters
	 * @param {boolean} excludeNsfw
	 */
	static applyFilters(params, filters, excludeNsfw) {
		if (!filters) {
			return;
		}

		ComixUtils.appendParam(params, 'statuses[]', filters.statuses);
		ComixUtils.appendParam(params, 'types[]', filters.types);

		if (filters.demographics) {
			ComixUtils.appendParam(params, 'demographics[]', filters.demographics.include);
			ComixUtils.appendParam(
				params,
				'demographics[]',
				(filters.demographics.exclude || []).map((value) => `-${value}`)
			);
		}

		if (filters.genres) {
			const included = filters.genres.include || [];
			const excluded = filters.genres.exclude || [];

			if (included.length > 0 || excluded.length > 0) {
				params.set('genres_mode', 'and');
			}

			ComixUtils.appendParam(params, 'genres_in[]', included);
			ComixUtils.appendParam(params, 'genres_ex[]', excluded);
		}

		if (filters.minChapter !== undefined && filters.minChapter !== null && filters.minChapter !== '') {
			const minChapter = Number(filters.minChapter);

			if (!Number.isFinite(minChapter) || minChapter <= 0) {
				throw new Error('Minimum chapter length must be a positive number');
			}

			params.set('min_chap', String(Math.floor(minChapter)));
		}

		if (filters.releaseYear) {
			if (filters.releaseYear.from) {
				params.set('release_year[from]', String(filters.releaseYear.from));
			}

			if (filters.releaseYear.to) {
				params.set('release_year[to]', String(filters.releaseYear.to));
			}
		}

		if (excludeNsfw) {
			ComixUtils.NSFW_GENRE_IDS.forEach((id) => params.append('genres_ex[]', id));
		}
	}

	/**
	 * @param {ComixPoster | null | undefined} poster
	 * @param {PosterQuality} quality
	 * @returns {string}
	 */
	static getPoster(poster, quality) {
		if (!poster) {
			return '';
		}

		switch (quality) {
			case 'large':
				return poster.large || poster.medium || poster.small || '';
			case 'small':
				return poster.small || poster.medium || poster.large || '';
			default:
				return poster.medium || poster.large || poster.small || '';
		}
	}

	/**
	 * @param {{ type?: string, genre?: Array<{ title: string }>, theme?: Array<{ title: string }>, demographic?: Array<{ title: string }>, contentRating?: string }} manga
	 * @returns {string[]}
	 */
	static getMangaGenres(manga) {
		const values = [];

		if (manga.type === 'manhwa') {
			values.push('Manhwa');
		} else if (manga.type === 'manhua') {
			values.push('Manhua');
		} else if (manga.type === 'manga') {
			values.push('Manga');
		} else if (manga.type) {
			values.push('Other');
		}

		(manga.genre || []).forEach((genre) => values.push(genre.title));
		(manga.theme || []).forEach((theme) => values.push(theme.title));
		(manga.demographic || []).forEach((demographic) => values.push(demographic.title));

		if (manga.contentRating === 'erotica' || manga.contentRating === 'pornographic') {
			values.push('NSFW');
		}

		return [...new Set(values)];
	}

	/**
	 * @param {any} manga
	 * @param {PosterQuality} posterQuality
	 * @returns {ComixManga}
	 */
	static mapManga(manga, posterQuality) {
		const slug = manga.url ? manga.url.replace('/title', '') : `/${manga.hid}`;

		return {
			id: manga.hid,
			title: manga.title,
			slug,
			poster: ComixUtils.getPoster(manga.poster, posterQuality),
			type: manga.type,
			status: manga.status,
			contentRating: manga.contentRating,
			authors: (manga.author || []).map((author) => author.title),
			artists: (manga.artist || []).map((artist) => artist.title),
			genres: ComixUtils.getMangaGenres(manga),
			altTitles: manga.alt_titles || [],
			synopsis: manga.synopsis || '',
			rating: manga.ratedAvg || 0,
			originalUrl: manga.url || ''
		};
	}

	/**
	 * @param {any} result
	 * @returns {PageInfo}
	 */
	static parsePageInfo(result) {
		const meta = result.meta || result.pagination || {};
		const page = meta.page || 1;
		const lastPage = meta.lastPage || meta.last_page || 1;
		const hasNext = meta.hasNext !== undefined ? meta.hasNext : page < lastPage;

		return { page, lastPage, hasNext };
	}

	/**
	 * @param {ComixListOptions & { query?: string }} [options]
	 * @returns {URLSearchParams}
	 */
	static buildMangaQuery({
		page = 1,
		limit = ComixUtils.DEFAULT_LIMIT,
		sort = 'score',
		order = 'desc',
		query,
		filters,
		excludeNsfw = true
	} = {}) {
		const params = new URLSearchParams();

		params.set('limit', String(limit));
		params.set('page', String(page));

		if (query) {
			params.set('keyword', query);
			params.set('order[relevance]', 'desc');
		} else if (sort) {
			params.set(`order[${sort}]`, order === 'asc' ? 'asc' : 'desc');
		}

		ComixUtils.applyFilters(params, filters, excludeNsfw);
		return params;
	}

	/**
	 * @param {MangaInput} input
	 * @returns {string}
	 */
	static normalizeSlugInput(input) {
		if (typeof input === 'string') {
			if (input.startsWith('http://') || input.startsWith('https://')) {
				const parsed = new URL(input);
				const host = parsed.host.replace(/^www\./, '');

				if (host !== 'comix.to') {
					throw new Error('Unsupported Comix URL');
				}

				return parsed.pathname
					.replace(/^\//, '')
					.replace(/^title\//, '')
					.replace(/^manga\//, '')
					.split('/')[0];
			}

			return input
				.replace(/^\//, '')
				.replace(/^title\//, '')
				.replace(/^manga\//, '')
				.split('/')[0];
		}

		if (input && typeof input === 'object') {
			const candidate = input.slug || input.url || input.id || '';

			return typeof candidate === 'string' ? ComixUtils.normalizeSlugInput(candidate) : '';
		}

		return '';
	}

	/**
	 * @param {string} slug
	 * @returns {string}
	 */
	static extractMangaId(slug) {
		if (!slug) {
			return '';
		}

		const cleaned = slug.replace(/^\//, '');
		const parts = cleaned.split('-');

		return parts[0] || cleaned;
	}

	/**
	 * @param {any} chapter
	 * @param {string} slug
	 * @param {string} webBase
	 * @returns {ComixChapter}
	 */
	static mapChapter(chapter, slug, webBase) {
		const number = String(chapter.number).replace(/\.0$/, '');
		const chapterSlug = `${chapter.id}-chapter-${number}`;

		return {
			id: chapter.id,
			number: chapter.number,
			name: chapter.name || `Chapter ${number}`,
			votes: chapter.votes || 0,
			createdAt: chapter.createdAtFormatted || '',
			isOfficial: chapter.isOfficial || false,
			scanlator: chapter.group ? chapter.group.name : chapter.isOfficial ? 'Official' : 'Unknown',
			url: `${webBase}/title/${slug}/${chapterSlug}`,
			chapterSlug
		};
	}

	/**
	 * @param {ComixChapter[]} chapters
	 * @returns {ComixChapter[]}
	 */
	static mergeChaptersByVotes(chapters) {
		const byNumber = new Map();

		chapters.forEach((chapter) => {
			const key = String(chapter.number).replace(/\.0$/, '');
			const current = byNumber.get(key);

			if (!current || (chapter.votes || 0) > (current.votes || 0)) {
				byNumber.set(key, chapter);
			}
		});

		return Array.from(byNumber.values()).sort((a, b) => {
			const aNum = Number(String(a.number).replace(/\.0$/, ''));
			const bNum = Number(String(b.number).replace(/\.0$/, ''));

			if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
				return bNum - aNum;
			}

			return (b.votes || 0) - (a.votes || 0);
		});
	}

	/**
	 * @param {ChapterInput} input
	 * @returns {string}
	 */
	static normalizeChapterInput(input) {
		if (typeof input === 'number') {
			return String(input);
		}

		if (typeof input === 'string') {
			if (input.startsWith('http://') || input.startsWith('https://')) {
				const parsed = new URL(input);
				const host = parsed.host.replace(/^www\./, '');

				if (host !== 'comix.to') {
					throw new Error('Unsupported Comix URL');
				}

				const segments = parsed.pathname.split('/').filter(Boolean);
				const last = segments[segments.length - 1] || '';

				return last.split('-')[0] || '';
			}

			const cleaned = input.replace(/^\//, '');

			return cleaned.split('-')[0] || cleaned;
		}

		if (input && typeof input === 'object') {
			return input.chapterId || input.id || input.url || '';
		}

		return '';
	}

	/**
	 * @param {string} query
	 * @returns {string | null}
	 */
	static extractIdFromUrl(query) {
		try {
			const parsed = new URL(query);
			const host = parsed.host.replace(/^www\./, '');

			if (host !== 'comix.to') {
				return null;
			}

			if (parsed.pathname.startsWith('/title/')) {
				const raw = parsed.pathname.split('/')[2] || '';

				return raw.split('-')[0] || null;
			}

			return null;
		} catch {
			return null;
		}
	}
}

class ComixHash {
	static get HASH_KEYS() {
		return [
			'JxTcdyiA5GZxnbrmthXBQfU2IMTKcY1+3nNhbq98Sgo=',
			'3PordjODbhqla382Cxapmo/1JiABJQcjiJj1+48gTJ4=',
			'OaKvnI5ARA==',
			'MHNBHYWA7lvy867fXgvGcJwWDk79KqUJUVFsh3RwnnI=',
			'8i0Cru/VJBSVB2Y1GcMDVpzx2WepOcfnWdd81yxICl4=',
			'Fyskubz8VvA=',
			'B46L1x+UeWP+19cRpQ+OZvdLAK9EHID8g3mSgn57tew=',
			'DTSTmUt6LpDUw9r1lSQqyb3YlFTzruT8tk8wUGkwehQ=',
			'vY/meeI=',
			'7xWfIF5THL5LAnRgAARg+4mjWHPU9n3PQwvzbaMNi+Q=',
			'bewtiTuV+HJk56xxkf2iCljLgruCpBmN9BgE8i6gc9M=',
			'/Xcb2zAu8AU=',
			'WgeCQ3T8R51uTwVSiVa7Zy0dN6JOg6Z5JleMS+HV8Aw=',
			'yXayUVFrrcW56jQCEfZzuCidjpnWKjTDUNT7XeX9i7k=',
			'tSLco2w='
		];
	}

	/**
	 * @param {number} index
	 * @returns {number[]}
	 */
	static getKeyBytes(index) {
		const b64 = ComixHash.HASH_KEYS[index];

		if (!b64) {
			return [];
		}

		try {
			return Array.from(Buffer.from(b64, 'base64')).map((value) => value & 0xff);
		} catch {
			return [];
		}
	}

	/**
	 * @param {number[]} key
	 * @param {number[]} data
	 * @returns {number[]}
	 */
	static rc4(key, data) {
		if (!key.length) {
			return data;
		}

		const s = Array.from({ length: 256 }, (_, index) => index);
		let j = 0;

		for (let i = 0; i < 256; i += 1) {
			j = (j + s[i] + key[i % key.length]) % 256;
			[s[i], s[j]] = [s[j], s[i]];
		}

		let i = 0;

		j = 0;
		const out = [];

		for (let k = 0; k < data.length; k += 1) {
			i = (i + 1) % 256;
			j = (j + s[i]) % 256;
			[s[i], s[j]] = [s[j], s[i]];
			out.push(data[k] ^ s[(s[i] + s[j]) % 256]);
		}

		return out;
	}

	static opShiftRight7Left1(value) {
		return ((value >>> 7) | (value << 1)) & 255;
	}

	static opShiftLeft1Right7(value) {
		return ((value << 1) | (value >>> 7)) & 255;
	}

	static opShiftRight2Left6(value) {
		return ((value >>> 2) | (value << 6)) & 255;
	}

	static opShiftLeft4Right4(value) {
		return ((value << 4) | (value >>> 4)) & 255;
	}

	static opShiftRight4Left4(value) {
		return ((value >>> 4) | (value << 4)) & 255;
	}

	static getMutKey(mutKey, idx) {
		return mutKey.length && idx % 32 < mutKey.length ? mutKey[idx % 32] : 0;
	}

	/**
	 * @param {number[]} data
	 * @param {number[]} mutKey
	 * @param {number[]} prefKey
	 * @param {number} prefKeyLimit
	 * @param {number} round
	 * @returns {number[]}
	 */
	static mutate(data, mutKey, prefKey, prefKeyLimit, round) {
		const out = [];

		for (let i = 0; i < data.length; i += 1) {
			if (i < prefKeyLimit && i < prefKey.length) {
				out.push(prefKey[i]);
			}

			let value = data[i] ^ ComixHash.getMutKey(mutKey, i);

			switch (round) {
				case 1:
					switch (i % 10) {
						case 0:
							value = ComixHash.opShiftRight7Left1(value);
							break;
						case 1:
							value ^= 37;
							break;
						case 2:
							value ^= 81;
							break;
						case 3:
							value ^= 147;
							break;
						case 4:
							value = ComixHash.opShiftRight2Left6(value);
							break;
						case 5:
						case 8:
							value = ComixHash.opShiftRight4Left4(value);
							break;
						case 6:
							value ^= 218;
							break;
						case 7:
							value = (value + 159) & 255;
							break;
						case 9:
							value ^= 180;
							break;
						default:
							break;
					}
					break;
				case 2:
					switch (i % 10) {
						case 0:
						case 9:
							value ^= 180;
							break;
						case 1:
							value = ComixHash.opShiftLeft1Right7(value);
							break;
						case 2:
							value ^= 147;
							break;
						case 3:
							value = ComixHash.opShiftRight7Left1(value);
							break;
						case 4:
							value = ComixHash.opShiftRight2Left6(value);
							break;
						case 5:
							value = ComixHash.opShiftRight4Left4(value);
							break;
						case 6:
						case 8:
							value = (value + 159) & 255;
							break;
						case 7:
							value = (value + 34) & 255;
							break;
						default:
							break;
					}
					break;
				case 3:
					switch (i % 10) {
						case 0:
							value ^= 81;
							break;
						case 1:
							value = ComixHash.opShiftRight4Left4(value);
							break;
						case 2:
						case 9:
							value = ComixHash.opShiftLeft4Right4(value);
							break;
						case 3:
							value ^= 37;
							break;
						case 4:
							value = (value + 159) & 255;
							break;
						case 5:
							value = ComixHash.opShiftLeft1Right7(value);
							break;
						case 6:
							value ^= 180;
							break;
						case 7:
							value = (value + 34) & 255;
							break;
						case 8:
							value = ComixHash.opShiftRight2Left6(value);
							break;
						default:
							break;
					}
					break;
				case 4:
					switch (i % 10) {
						case 0:
						case 7:
							value ^= 218;
							break;
						case 1:
						case 4:
							value = ComixHash.opShiftLeft1Right7(value);
							break;
						case 2:
							value = ComixHash.opShiftRight7Left1(value);
							break;
						case 3:
							value = (value + 159) & 255;
							break;
						case 5:
						case 8:
							value ^= 180;
							break;
						case 6:
							value ^= 147;
							break;
						case 9:
							value ^= 37;
							break;
						default:
							break;
					}
					break;
				case 5:
					switch (i % 10) {
						case 0:
							value = ComixHash.opShiftLeft4Right4(value);
							break;
						case 1:
						case 3:
							value ^= 147;
							break;
						case 2:
							value = (value + 34) & 255;
							break;
						case 4:
						case 9:
							value ^= 218;
							break;
						case 5:
						case 7:
							value = ComixHash.opShiftLeft1Right7(value);
							break;
						case 6:
							value ^= 180;
							break;
						case 8:
							value = ComixHash.opShiftRight2Left6(value);
							break;
						default:
							break;
					}
					break;
				default:
					break;
			}

			out.push(value & 255);
		}

		return out;
	}

	/**
	 * @param {number[]} data
	 * @returns {number[]}
	 */
	static round1(data) {
		return ComixHash.rc4(
			ComixHash.getKeyBytes(0),
			ComixHash.mutate(data, ComixHash.getKeyBytes(1), ComixHash.getKeyBytes(2), 7, 1)
		);
	}

	/**
	 * @param {number[]} data
	 * @returns {number[]}
	 */
	static round2(data) {
		return ComixHash.rc4(
			ComixHash.getKeyBytes(3),
			ComixHash.mutate(data, ComixHash.getKeyBytes(4), ComixHash.getKeyBytes(5), 8, 2)
		);
	}

	/**
	 * @param {number[]} data
	 * @returns {number[]}
	 */
	static round3(data) {
		return ComixHash.rc4(
			ComixHash.getKeyBytes(6),
			ComixHash.mutate(data, ComixHash.getKeyBytes(7), ComixHash.getKeyBytes(8), 5, 3)
		);
	}

	/**
	 * @param {number[]} data
	 * @returns {number[]}
	 */
	static round4(data) {
		return ComixHash.rc4(
			ComixHash.getKeyBytes(9),
			ComixHash.mutate(data, ComixHash.getKeyBytes(10), ComixHash.getKeyBytes(11), 8, 4)
		);
	}

	/**
	 * @param {number[]} data
	 * @returns {number[]}
	 */
	static round5(data) {
		return ComixHash.rc4(
			ComixHash.getKeyBytes(12),
			ComixHash.mutate(data, ComixHash.getKeyBytes(13), ComixHash.getKeyBytes(14), 5, 5)
		);
	}

	/**
	 * @param {string} path
	 * @returns {string}
	 */
	static generateHash(path) {
		const encoded = encodeURIComponent(path).replace(/\*/g, '%2A').replace(/%7E/g, '~');
		const initialBytes = Array.from(Buffer.from(encoded, 'ascii')).map((value) => value & 0xff);
		const r1 = ComixHash.round1(initialBytes);
		const r2 = ComixHash.round2(r1);
		const r3 = ComixHash.round3(r2);
		const r4 = ComixHash.round4(r3);
		const r5 = ComixHash.round5(r4);
		const finalBytes = Buffer.from(Uint8Array.from(r5));

		return finalBytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
	}
}

/**
 * @template TItem
 */
class ComixResponse {
	/**
	 * @param {{ comix: Comix, items?: TItem[], pageInfo?: PageInfo, context?: Record<string, unknown> }} param0
	 */
	constructor({ comix, items, pageInfo, context }) {
		this.comix = comix;
		this.items = items || [];
		this.pageInfo = pageInfo || { page: 1, lastPage: 1, hasNext: false };
		this.context = context || {};
	}

	/** @returns {boolean} */
	hasNext() {
		return Boolean(this.pageInfo?.hasNext);
	}

	/** @returns {Promise<ComixResponse<TItem>>} */
	nextPage() {
		if (typeof this.context.nextPage !== 'function') {
			throw new Error('No next page available');
		}

		return this.context.nextPage();
	}

	/**
	 * @param {number} [index]
	 * @returns {Promise<ComixItemResponse>}
	 */
	getDetail(index = 0) {
		if (!this.items.length) {
			throw new Error('No items available');
		}

		return this.comix.getDetail(this.items[index]);
	}

	/**
	 * @param {number} [index]
	 * @param {ComixChaptersOptions} [options]
	 * @returns {Promise<ComixResponse<ComixChapter>>}
	 */
	getChapters(index = 0, options = {}) {
		if (this.context.type === 'detail' && this.context.item) {
			return this.comix.getChapters(this.context.item, options);
		}

		if (!this.items.length) {
			throw new Error('No items available');
		}

		return this.comix.getChapters(this.items[index], options);
	}

	/**
	 * @param {ChapterInput} [chapterInput]
	 * @returns {Promise<ComixPage[]>}
	 */
	getChapterPages(chapterInput) {
		if (!chapterInput && this.items.length) {
			return this.comix.getChapterPages(this.items[0]);
		}

		return this.comix.getChapterPages(chapterInput);
	}
}

class ComixItemResponse extends ComixResponse {
	/**
	 * @param {{ comix: Comix, item: ComixManga }} param0
	 */
	constructor({ comix, item }) {
		super({
			comix,
			items: [item],
			pageInfo: { page: 1, lastPage: 1, hasNext: false },
			context: { type: 'detail', item }
		});
	}

	/** @returns {Promise<ComixItemResponse>} */
	getDetail() {
		return Promise.resolve(this);
	}
}

/**
 * @typedef {import('./types/comix').FetchLike} FetchLike
 * @typedef {import('./types/comix').ComixListOptions} ComixListOptions
 * @typedef {import('./types/comix').ComixHomeOptions} ComixHomeOptions
 * @typedef {import('./types/comix').ComixFilters} ComixFilters
 * @typedef {import('./types/comix').ComixChaptersOptions} ComixChaptersOptions
 * @typedef {import('./types/comix').MangaInput} MangaInput
 * @typedef {import('./types/comix').ChapterInput} ChapterInput
 * @typedef {import('./types/comix').ComixManga} ComixManga
 * @typedef {import('./types/comix').ComixChapter} ComixChapter
 * @typedef {import('./types/comix').ComixPage} ComixPage
 * @typedef {import('./types/comix').PageInfo} PageInfo
 */
class Comix {
	/**
	 * @param {{ fetchImpl?: FetchLike, apiBase?: string, webBase?: string }} [options]
	 */
	constructor({ fetchImpl, apiBase, webBase } = {}) {
		this.fetchImpl = fetchImpl || fetch;
		this.apiBase = apiBase || ComixUtils.API_BASE;
		this.webBase = webBase || ComixUtils.WEB_BASE;
	}

	/**
	 * @param {string} url
	 * @returns {Promise<any>}
	 */
	async fetchJSON(url) {
		const response = await this.fetchImpl(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
			}
		});

		return response.json();
	}

	/**
	 * @returns {{
	 *   sorts: Array<{ label: string, value: string }>,
	 *   statuses: Array<{ label: string, value: string }>,
	 *   types: Array<{ label: string, value: string }>,
	 *   demographics: Array<{ label: string, value: string }>,
	 *   genres: Array<{ label: string, value: string }>,
	 *   releaseYears: { from: Array<{ label: string, value: string }>, to: Array<{ label: string, value: string }> }
	 * }}
	 */
	getFilters() {
		return {
			sorts: ComixUtils.SORT_OPTIONS,
			statuses: ComixUtils.STATUS_OPTIONS,
			types: ComixUtils.TYPE_OPTIONS,
			demographics: ComixUtils.DEMOGRAPHIC_OPTIONS,
			genres: ComixUtils.GENRE_OPTIONS,
			releaseYears: {
				from: ComixUtils.buildYears(true),
				to: ComixUtils.buildYears(false)
			}
		};
	}

	/**
	 * @param {URLSearchParams} params
	 * @returns {Promise<{ items: any[], pageInfo: PageInfo }>}
	 */
	async fetchMangaList(params) {
		const url = new URL(`${this.apiBase}/manga`);

		url.search = params.toString();
		const data = await this.fetchJSON(url.toString());
		const items = data?.result?.items || [];
		const pageInfo = ComixUtils.parsePageInfo(data?.result || {});

		return { items, pageInfo };
	}

	/**
	 * @param {string} id
	 * @returns {Promise<any>}
	 */
	fetchMangaById(id) {
		const url = new URL(`${this.apiBase}/manga/${id}`);

		url.searchParams.append('includes[]', 'demographic');
		url.searchParams.append('includes[]', 'genre');
		url.searchParams.append('includes[]', 'theme');
		url.searchParams.append('includes[]', 'author');
		url.searchParams.append('includes[]', 'artist');
		url.searchParams.append('includes[]', 'publisher');
		return this.fetchJSON(url.toString());
	}

	/**
	 * @param {ComixListOptions} [options]
	 * @returns {Promise<ComixResponse<ComixManga>>}
	 */
	async getComics(options = {}) {
		const params = ComixUtils.buildMangaQuery(options);
		const { items, pageInfo } = await this.fetchMangaList(params);
		const posterQuality = options.posterQuality || 'large';
		const mapped = items.map((manga) => ComixUtils.mapManga(manga, posterQuality));

		return new ComixResponse({
			comix: this,
			items: mapped,
			pageInfo,
			context: {
				type: 'list',
				nextPage: pageInfo.hasNext ? () => this.getComics({ ...options, page: pageInfo.page + 1 }) : null
			}
		});
	}

	/**
	 * @param {string} query
	 * @param {ComixListOptions} [options]
	 * @returns {Promise<ComixResponse<ComixManga>>}
	 */
	async search(query, options = {}) {
		const idFromUrl = ComixUtils.extractIdFromUrl(query);

		if (idFromUrl) {
			const data = await this.fetchMangaById(idFromUrl);
			const posterQuality = options.posterQuality || 'large';
			const manga = ComixUtils.mapManga(data.result, posterQuality);

			return new ComixResponse({
				comix: this,
				items: [manga],
				pageInfo: { page: 1, lastPage: 1, hasNext: false },
				context: { type: 'search', nextPage: null }
			});
		}

		const params = ComixUtils.buildMangaQuery({ ...options, query });
		const { items, pageInfo } = await this.fetchMangaList(params);
		const posterQuality = options.posterQuality || 'large';
		const mapped = items.map((manga) => ComixUtils.mapManga(manga, posterQuality));

		return new ComixResponse({
			comix: this,
			items: mapped,
			pageInfo,
			context: {
				type: 'search',
				nextPage: pageInfo.hasNext ? () => this.search(query, { ...options, page: pageInfo.page + 1 }) : null
			}
		});
	}

	/**
	 * @param {ComixFilters} [filters]
	 * @param {ComixListOptions} [options]
	 * @returns {Promise<ComixResponse<ComixManga>>}
	 */
	async filter(filters = {}, options = {}) {
		const params = ComixUtils.buildMangaQuery({ ...options, filters });
		const { items, pageInfo } = await this.fetchMangaList(params);
		const posterQuality = options.posterQuality || 'large';
		const mapped = items.map((manga) => ComixUtils.mapManga(manga, posterQuality));

		return new ComixResponse({
			comix: this,
			items: mapped,
			pageInfo,
			context: {
				type: 'filter',
				nextPage: pageInfo.hasNext ? () => this.filter(filters, { ...options, page: pageInfo.page + 1 }) : null
			}
		});
	}

	/**
	 * @param {ComixHomeOptions} [options]
	 * @returns {Promise<{ popular: ComixResponse<ComixManga>, latest: ComixResponse<ComixManga>, recentlyAdded: ComixResponse<ComixManga>, mostViewed30Days: ComixResponse<ComixManga> }>}
	 */
	async getHome(options = {}) {
		const base = {
			page: options.page || 1,
			limit: options.limit || ComixUtils.DEFAULT_LIMIT,
			excludeNsfw: options.excludeNsfw !== false,
			posterQuality: options.posterQuality || 'large'
		};

		const [popular, latest, recentlyAdded, mostViewed] = await Promise.all([
			this.getComics({ ...base, sort: 'score', order: 'desc' }),
			this.getComics({ ...base, sort: 'chapter_updated_at', order: 'desc' }),
			this.getComics({ ...base, sort: 'created_at', order: 'desc' }),
			this.getComics({ ...base, sort: 'views_30d', order: 'desc' })
		]);

		return {
			popular,
			latest,
			recentlyAdded,
			mostViewed30Days: mostViewed
		};
	}

	/**
	 * @param {MangaInput} mangaInput
	 * @returns {Promise<ComixItemResponse>}
	 */
	async getDetail(mangaInput) {
		const slug = ComixUtils.normalizeSlugInput(mangaInput);
		const mangaId = ComixUtils.extractMangaId(slug || mangaInput?.id || mangaInput);

		if (!mangaId) {
			throw new Error('Missing manga id or slug');
		}

		const data = await this.fetchMangaById(mangaId);
		const posterQuality = mangaInput?.posterQuality || 'large';
		const mappedInput = mangaInput && typeof mangaInput === 'object' && mangaInput.id && mangaInput.title ? mangaInput : null;

		if (!data?.result) {
			if (mappedInput) {
				return new ComixItemResponse({ comix: this, item: mappedInput });
			}

			throw new Error('Comix detail not found');
		}

		const manga = ComixUtils.mapManga(data.result, posterQuality);

		return new ComixItemResponse({ comix: this, item: manga });
	}

	/**
	 * @param {{ mangaId: string, mangaSlug: string, page: number, limit: number }} params
	 * @returns {Promise<any>}
	 */
	async fetchChaptersPage({ mangaId, mangaSlug, page, limit }) {
		const path = `/manga/${mangaId}/chapters`;
		const hashToken = ComixHash.generateHash(path);
		const url = new URL(`${this.apiBase}${path}`);

		url.searchParams.set('order[number]', 'desc');
		url.searchParams.set('limit', String(limit));
		url.searchParams.set('page', String(page));
		url.searchParams.set('_', hashToken);
		url.searchParams.set('mangaSlug', mangaSlug || mangaId);

		return this.fetchJSON(url.toString());
	}

	/**
	 * @param {MangaInput} mangaInput
	 * @param {ComixChaptersOptions} [options]
	 * @returns {Promise<ComixResponse<ComixChapter>>}
	 */
	async getChapters(mangaInput, options = {}) {
		const slug = ComixUtils.normalizeSlugInput(mangaInput);
		const mangaId = ComixUtils.extractMangaId(slug || mangaInput?.id || mangaInput);

		if (!mangaId) {
			throw new Error('Missing manga id or slug');
		}

		const limit = options.limit || 100;
		let page = options.page || 1;
		const allPages = options.allPages !== false;
		const chapters = [];
		let pageInfo = { page, lastPage: page, hasNext: false };

		do {
			const data = await this.fetchChaptersPage({ mangaId, mangaSlug: slug || mangaId, page, limit });
			const items = data?.result?.items || [];

			pageInfo = ComixUtils.parsePageInfo(data?.result || {});
			chapters.push(...items.map((chapter) => ComixUtils.mapChapter(chapter, slug || mangaId, this.webBase)));
			page += 1;
		} while (allPages && pageInfo.hasNext);

		const mergedChapters = ComixUtils.mergeChaptersByVotes(chapters);

		return new ComixResponse({
			comix: this,
			items: mergedChapters,
			pageInfo,
			context: {
				type: 'chapters',
				item: mangaInput,
				nextPage: pageInfo.hasNext
					? () => this.getChapters(mangaInput, { ...options, page: pageInfo.page + 1, allPages: false })
					: null
			}
		});
	}

	/**
	 * @param {string} chapterId
	 * @returns {Promise<any>}
	 */
	async fetchChapterPages(chapterId) {
		const path = `/chapters/${chapterId}`;
		const hashToken = ComixHash.generateHash(path);
		const url = new URL(`${this.apiBase}${path}`);

		url.searchParams.set('_', hashToken);
		return this.fetchJSON(url.toString());
	}

	/**
	 * @param {ChapterInput} chapterInput
	 * @returns {Promise<ComixPage[]>}
	 */
	async getChapterPages(chapterInput) {
		const chapterId = ComixUtils.normalizeChapterInput(chapterInput);

		if (!chapterId) {
			throw new Error('Missing chapter id or url');
		}

		const data = await this.fetchChapterPages(chapterId);
		const pages = data?.result?.pages || [];

		return pages.map((page, index) => ({
			index,
			url: page.url
		}));
	}
}

export { Comix, ComixHash, ComixItemResponse, ComixResponse, ComixUtils };
