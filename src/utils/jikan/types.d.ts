const Type = {
	ANIME: ['tv', 'movie', 'ova', 'special', 'ona', 'music', 'cm', 'pv', 'tv_special'],
	MANGA: ['manga', 'novel', 'lightnovel', 'oneshot', 'doujin', 'manhwa', 'manhua']
} as const;

export type AnimeType = (typeof Type.ANIME)[number];
export type MangaType = (typeof Type.MANGA)[number];
