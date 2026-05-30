export class ComixUtils {
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
		return ['87264', '8', '87265', '13', '87266', '87267', '87268'];
	}
	static get DEFAULT_CONTENT_RATING() {
		return 'suggestive';
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
			{ label: 'Shounen', value: '2' },
			{ label: 'Shoujo', value: '1' },
			{ label: 'Seinen', value: '4' },
			{ label: 'Josei', value: '3' }
		];
	}

	static get GENRE_OPTIONS() {
		return [
			{ label: 'Romance', value: '23' },
			{ label: 'Drama', value: '11' },
			{ label: 'Comedy', value: '9' },
			{ label: 'Fantasy', value: '12' },
			{ label: 'Slice of Life', value: '25' },
			{ label: 'Action', value: '6' },
			{ label: 'Boys Love', value: '8' },
			{ label: 'Adventure', value: '7' },
			{ label: 'Adult', value: '87264' },
			{ label: 'Smut', value: '87268' },
			{ label: 'Psychological', value: '22' },
			{ label: 'Mystery', value: '20' },
			{ label: 'Historical', value: '14' },
			{ label: 'Mature', value: '87267' },
			{ label: 'Tragedy', value: '29' },
			{ label: 'Sci-Fi', value: '24' },
			{ label: 'Ecchi', value: '87265' },
			{ label: 'Horror', value: '15' },
			{ label: 'Girls Love', value: '13' },
			{ label: 'Isekai', value: '16' },
			{ label: 'Hentai', value: '87266' },
			{ label: 'Thriller', value: '28' },
			{ label: 'Sports', value: '26' },
			{ label: 'Crime', value: '10' },
			{ label: 'Philosophical', value: '21' },
			{ label: 'Mecha', value: '18' },
			{ label: 'Wuxia', value: '30' },
			{ label: 'Medical', value: '19' },
			{ label: 'Superhero', value: '27' },
			{ label: 'Magical Girls', value: '17' }
		];
	}

	static get FORMAT_OPTIONS() {
		return [
			{ label: '4-Koma', value: '93164' },
			{ label: 'Adaptation', value: '93167' },
			{ label: 'Anthology', value: '93165' },
			{ label: 'Award Winning', value: '93166' },
			{ label: 'Doujinshi', value: '93168' },
			{ label: 'Full Color', value: '93172' },
			{ label: 'Long Strip', value: '93170' },
			{ label: 'Oneshot', value: '93169' },
			{ label: 'Web Comic', value: '93171' }
		];
	}

	static get CONTENT_RATING_OPTIONS() {
		return [
			{ label: 'Safe only', value: 'safe' },
			{ label: 'Up to Suggestive', value: 'suggestive' },
			{ label: 'Up to Erotica', value: 'erotica' },
			{ label: 'Up to Pornographic', value: 'pornographic' }
		];
	}

	static buildYears(includeOlder) {
		const currentYear = new Date().getFullYear();
		const newest = currentYear + 1;
		const years = [];

		for (let year = newest; year >= 1928; year -= 1) {
			years.push({ label: String(year), value: String(year) });
		}

		if (includeOlder) {
			years.push({ label: 'Any', value: '' });
		}

		return years;
	}

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

	static applyFilters(params, filters, excludeNsfw) {
		if (!filters) {
			return;
		}

		ComixUtils.appendParam(params, 'authors[]', filters.authors);
		ComixUtils.appendParam(params, 'artists[]', filters.artists);
		ComixUtils.appendParam(params, 'statuses[]', filters.statuses);
		ComixUtils.appendParam(params, 'types[]', filters.types);

		if (filters.contentRating) {
			params.set('content_rating', filters.contentRating);
		} else if (!params.has('content_rating')) {
			params.set('content_rating', ComixUtils.DEFAULT_CONTENT_RATING);
		}

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
				params.set('genres_mode', filters.genresMode || 'and');
			}

			ComixUtils.appendParam(params, 'genres_in[]', included);
			ComixUtils.appendParam(params, 'genres_ex[]', excluded);
		}

		if (filters.formats) {
			const included = filters.formats.include || [];
			const excluded = filters.formats.exclude || [];

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
				params.set('year_from', String(filters.releaseYear.from));
			}

			if (filters.releaseYear.to) {
				params.set('year_to', String(filters.releaseYear.to));
			}
		}

		if (excludeNsfw) {
			const explicitlyIncluded = new Set(filters.genres?.include || []);
			const blockedGenres = filters.blockedGenres || ComixUtils.NSFW_GENRE_IDS;

			blockedGenres.forEach((id) => {
				if (!explicitlyIncluded.has(id)) {
					params.append('genres_ex[]', id);
				}
			});
		}
	}

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

		const genres = manga.genres || manga.genre || [];
		const tags = manga.tags || manga.theme || [];
		const demographics = manga.demographics || manga.demographic || [];
		const formats = manga.formats || [];

		genres.forEach((item) => values.push(item.title));
		demographics.forEach((item) => values.push(item.title));
		formats.forEach((item) => values.push(item.title));
		tags.forEach((item) => values.push(item.title));

		if (manga.contentRating === 'erotica' || manga.contentRating === 'pornographic') {
			values.push('NSFW');
		}

		return [...new Set(values)];
	}

	static mapManga(manga, posterQuality) {
		const slug = manga.url ? manga.url.replace('/title', '') : `/${manga.hid}`;
		const authors = manga.authors || manga.author || [];
		const artists = manga.artists || manga.artist || [];
		const altTitles = manga.altTitles || manga.alt_titles || [];

		return {
			id: manga.hid,
			title: manga.title,
			slug,
			poster: ComixUtils.getPoster(manga.poster, posterQuality),
			type: manga.type,
			status: manga.status,
			contentRating: manga.contentRating,
			authors: authors.map((a) => a.title),
			artists: artists.map((a) => a.title),
			genres: ComixUtils.getMangaGenres(manga),
			altTitles,
			synopsis: manga.synopsis || '',
			rating: manga.ratedAvg || 0,
			year: manga.year || null,
			originalUrl: manga.url || ''
		};
	}

	static parsePageInfo(result) {
		const meta = result.meta || result.pagination || {};
		const page = meta.page || 1;
		const lastPage = Math.max(meta.lastPage || 1, meta.last_page || 1);

		return { page, lastPage, hasNext: page < lastPage };
	}

	static buildMangaQuery({
		page = 1,
		limit = ComixUtils.DEFAULT_LIMIT,
		sort = 'score',
		order = 'desc',
		query,
		filters,
		excludeNsfw = true,
		defaultTypes,
		defaultDemographics
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

		if (!params.has('types[]') && defaultTypes?.length) {
			const allTypes = ComixUtils.TYPE_OPTIONS.map((t) => t.value);

			if (defaultTypes.length < allTypes.length) {
				defaultTypes.forEach((t) => params.append('types[]', t));
			}
		}

		if (!params.has('demographics[]') && defaultDemographics?.length) {
			const allDemos = ComixUtils.DEMOGRAPHIC_OPTIONS.map((d) => d.value);

			if (defaultDemographics.length < allDemos.length) {
				defaultDemographics.forEach((d) => params.append('demographics[]', d));
			}
		}

		return params;
	}

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

	static extractMangaId(slug) {
		if (!slug) {
			return '';
		}

		const cleaned = slug.replace(/^\//, '');

		return cleaned.split('-')[0] || cleaned;
	}

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
			groupId: chapter.group?.id || null,
			scanlator: chapter.group ? chapter.group.name : chapter.isOfficial ? 'Official' : 'Unknown',
			url: `${webBase}/title/${slug}/${chapterSlug}`,
			chapterSlug
		};
	}

	static deduplicateChapters(chapters) {
		const byNumber = new Map();

		for (const chapter of chapters) {
			const key = String(chapter.number).replace(/\.0$/, '');
			const current = byNumber.get(key);

			if (!current) {
				byNumber.set(key, chapter);
				continue;
			}

			const newIsOfficial = chapter.isOfficial;
			const currentIsOfficial = current.isOfficial;
			const newIsGroup10702 = chapter.groupId === 10702;
			const currentIsGroup10702 = current.groupId === 10702;

			let better = false;

			if (newIsOfficial && !currentIsOfficial) {
				better = true;
			} else if (!newIsOfficial && currentIsOfficial) {
				better = false;
			} else if (newIsGroup10702 && !currentIsGroup10702) {
				better = true;
			} else if (!newIsGroup10702 && currentIsGroup10702) {
				better = false;
			} else if ((chapter.votes || 0) > (current.votes || 0)) {
				better = true;
			} else if ((chapter.votes || 0) < (current.votes || 0)) {
				better = false;
			} else {
				better = chapter.id > current.id;
			}

			if (better) {
				byNumber.set(key, chapter);
			}
		}

		return Array.from(byNumber.values()).sort((a, b) => {
			const aNum = Number(String(a.number).replace(/\.0$/, ''));
			const bNum = Number(String(b.number).replace(/\.0$/, ''));

			if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
				return bNum - aNum;
			}

			return (b.votes || 0) - (a.votes || 0);
		});
	}

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

				if (segments.length >= 3 && segments[0] === 'title') {
					const chapterSegment = segments[2] || '';

					if (!chapterSegment.includes('-')) {
						throw new Error('Outdated chapter URL. Please refresh the chapter list');
					}
				}

				const last = segments[segments.length - 1] || '';

				return last.split('-')[0] || '';
			}

			const cleaned = input.replace(/^\//, '');

			if (cleaned.includes('/')) {
				const parts = cleaned.split('/');
				const chapterSegment = parts[parts.length - 1] || '';

				if (!chapterSegment.includes('-')) {
					throw new Error('Outdated chapter URL. Please refresh the chapter list');
				}

				return chapterSegment.split('-')[0] || chapterSegment;
			}

			return cleaned.split('-')[0] || cleaned;
		}

		if (input && typeof input === 'object') {
			return input.chapterId || input.id || input.url || '';
		}

		return '';
	}

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
