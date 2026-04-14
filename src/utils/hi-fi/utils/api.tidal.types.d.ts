export type TrackQuality = 'HI_RES_LOSSLESS' | 'LOSSLESS' | 'HIGH' | 'LOW';

export type TidalApiJson = Record<string, any>;

export type TidalApiText = string;

export type TidalBaseResponse = {
	/** API wrapper version returned by upstream endpoint. */
	version?: string;
	/** Responding host used for this request (injected by wrapper). */
	domain?: string;
};

export type TidalArtistRef = {
	/** Numeric TIDAL artist ID. */
	id?: number;
	/** Display name of the artist. */
	name?: string;
	/** Artist image UUID/reference (when available). */
	picture?: string;
	/** Artist role/type in relation to track/album (e.g., MAIN). */
	type?: string;
};

export type TidalAlbumRef = {
	/** Numeric TIDAL album ID. */
	id?: number;
	/** Album title. */
	title?: string;
	/** Album cover UUID/reference. */
	cover?: string;
	/** Video cover UUID/reference. */
	videoCover?: string;
	/** Album release date string (usually YYYY-MM-DD). */
	releaseDate?: string;
	/** Number of tracks in album. */
	numberOfTracks?: number;
	/** Whether album contains explicit content. */
	explicit?: boolean;
	/** Best available audio quality for this album. */
	audioQuality?: string;
	/** Primary artist object. */
	artist?: TidalArtistRef;
	/** All contributing artists. */
	artists?: TidalArtistRef[];
};

export type TidalTrackMixes = {
	/** ID for track mix endpoint usage. */
	TRACK_MIX?: string;
	/** ID for master mix endpoint usage. */
	MASTER_MIX?: string;
	/** ID for daily mix endpoint usage. */
	DAILY_MIX?: string;
	/** Additional mix IDs keyed by provider-defined labels. */
	[key: string]: string | undefined;
};

export type TidalTrackItem = {
	/** Numeric TIDAL track ID. */
	id: number;
	/** Track title. */
	title?: string;
	/** Duration in seconds. */
	duration?: number;
	/** Track replay-gain loudness value. */
	replayGain?: number;
	/** Peak amplitude value. */
	peak?: number;
	/** Whether streaming is allowed. */
	allowStreaming?: boolean;
	/** Whether stream URL/manifest is ready. */
	streamReady?: boolean;
	/** Whether user must pay to stream. */
	payToStream?: boolean;
	/** Whether ad-supported stream is available. */
	adSupportedStreamReady?: boolean;
	/** Whether DJ mode is available. */
	djReady?: boolean;
	/** Whether stem mode is available. */
	stemReady?: boolean;
	/** Stream availability date/time. */
	streamStartDate?: string;
	/** Whether premium subscription is required. */
	premiumStreamingOnly?: boolean;
	/** Track index inside the album volume. */
	trackNumber?: number;
	/** Album volume/disc number. */
	volumeNumber?: number;
	/** Alternate title/version label. */
	version?: string;
	/** Popularity score from provider. */
	popularity?: number;
	/** Copyright text. */
	copyright?: string;
	/** Estimated BPM. */
	bpm?: number;
	/** Musical key. */
	key?: string;
	/** Musical key scale/mode. */
	keyScale?: string;
	/** Public TIDAL URL for this track. */
	url?: string;
	/** ISRC code. */
	isrc?: string;
	/** Whether track metadata is editable. */
	editable?: boolean;
	/** Whether track contains explicit content. */
	explicit?: boolean;
	/** Best available audio quality for this track. */
	audioQuality?: string;
	/** Supported audio modes (e.g., STEREO). */
	audioModes?: string[];
	/** Extra media metadata from provider. */
	mediaMetadata?: Record<string, any>;
	/** Upload metadata/flags from provider. */
	upload?: Record<string, any>;
	/** Access mode/type classification. */
	accessType?: string;
	/** Whether item is spotlighted/promoted. */
	spotlighted?: boolean;
	/** Main artist object. */
	artist?: TidalArtistRef;
	/** All track artists/contributors. */
	artists?: TidalArtistRef[];
	/** Parent album metadata. */
	album?: TidalAlbumRef;
	/** Mix IDs used for mix lookups. */
	mixes?: TidalTrackMixes;
};

export type TidalPlaylistSearchItem = {
	/** Playlist UUID commonly used by getPlaylist. */
	uuid?: string;
	/** Optional playlist ID variant. */
	id?: string;
	/** Playlist title. */
	title?: string;
	/** Number of tracks in playlist. */
	numberOfTracks?: number;
	/** Number of videos in playlist. */
	numberOfVideos?: number;
	/** Playlist creator object. */
	creator?: Record<string, any>;
	/** Playlist description text. */
	description?: string;
	/** Total duration in seconds. */
	duration?: number;
	/** Last updated timestamp. */
	lastUpdated?: string;
	/** Creation timestamp. */
	created?: string;
	/** Playlist type/category. */
	type?: string;
	/** Whether playlist is public. */
	publicPlaylist?: boolean;
	/** Public TIDAL URL. */
	url?: string;
	/** Cover image UUID/reference. */
	image?: string;
	/** Popularity score. */
	popularity?: number;
	/** Square image UUID/reference. */
	squareImage?: string;
	/** Custom image URL if present. */
	customImageUrl?: string;
	/** Artists promoted by this playlist. */
	promotedArtists?: TidalArtistRef[];
	/** Timestamp of the last added item. */
	lastItemAddedAt?: string;
};

export type TidalAlbumSearchItem = {
	/** Numeric album ID. */
	id?: number;
	/** Album title. */
	title?: string;
	/** Public album URL. */
	url?: string;
	/** Album cover UUID/reference. */
	cover?: string;
	/** Release date (usually YYYY-MM-DD). */
	releaseDate?: string;
	/** Album type/category. */
	type?: string;
	/** Number of tracks in album. */
	numberOfTracks?: number;
	/** Number of videos in album context. */
	numberOfVideos?: number;
	/** Explicit content flag. */
	explicit?: boolean;
	/** Popularity score. */
	popularity?: number;
	/** Best audio quality available. */
	audioQuality?: string;
	/** Supported audio modes. */
	audioModes?: string[];
	/** Primary artist object. */
	artist?: TidalArtistRef;
	/** All album artists. */
	artists?: TidalArtistRef[];
	/** Extra provider-specific fields. */
	[key: string]: any;
};

export type TidalVideoSearchItem = {
	/** Numeric video ID. */
	id?: number;
	/** Video title. */
	title?: string;
	/** Public video URL. */
	url?: string;
	/** Duration in seconds. */
	duration?: number;
	/** Quality label/resolution metadata. */
	quality?: string;
	/** Primary artist object. */
	artist?: TidalArtistRef;
	/** All associated artists. */
	artists?: TidalArtistRef[];
	/** Extra provider-specific fields. */
	[key: string]: any;
};

export type TidalGenreSearchItem = {
	/** Genre identifier. */
	id?: string | number;
	/** Genre display name. */
	name?: string;
	/** Genre path/slug. */
	path?: string;
	/** Genre URL. */
	url?: string;
	/** Extra provider-specific fields. */
	[key: string]: any;
};

export type TidalTopHitItem = TidalTrackItem | TidalAlbumSearchItem | TidalPlaylistSearchItem | TidalVideoSearchItem;

export type TidalPagedItems<T = any> = {
	/** Max number of results returned in this page. */
	limit?: number;
	/** Offset used for this page. */
	offset?: number;
	/** Total result count on upstream service. */
	totalNumberOfItems?: number;
	/** Current page items with concrete generic type T. */
	items?: T[];
};

export type TidalSearchTrackResponse = TidalBaseResponse & {
	data: {
		/** Max number of results returned in this page. */
		limit?: number;
		/** Offset used for this page. */
		offset?: number;
		/** Total count available on upstream service. */
		totalNumberOfItems?: number;
		/** Track results for s/i query. */
		items?: TidalTrackItem[];
	};
};

export type TidalSearchGroupedResponse = TidalBaseResponse & {
	data: {
		/** Artist bucket for grouped search. */
		artists?: TidalPagedItems<TidalArtistRef>;
		/** Album bucket for grouped search. */
		albums?: TidalPagedItems<TidalAlbumSearchItem>;
		/** Playlist bucket for grouped search. */
		playlists?: TidalPagedItems<TidalPlaylistSearchItem>;
		/** Track bucket for grouped search. */
		tracks?: TidalPagedItems<TidalTrackItem>;
		/** Video bucket for grouped search. */
		videos?: TidalPagedItems<TidalVideoSearchItem>;
		/** Genre bucket for grouped search. */
		genres?: TidalPagedItems<TidalGenreSearchItem>;
		/** Top hits bucket containing mixed entity types. */
		topHits?: TidalPagedItems<TidalTopHitItem>;
	};
};

export type TidalTrackStreamData = {
	trackId?: number;
	assetPresentation?: string;
	audioMode?: string;
	audioQuality?: string;
	manifestMimeType?: string;
	manifestHash?: string;
	manifest?: string;
	albumReplayGain?: number;
	albumPeakAmplitude?: number;
	trackReplayGain?: number;
	trackPeakAmplitude?: number;
};

export type TidalInfoResponse = TidalBaseResponse & {
	data?: TidalTrackItem;
};

export type TidalTrackResponse = TidalBaseResponse & {
	data?: TidalTrackStreamData;
};

export type TidalAlbumEntry = {
	item?: TidalTrackItem | TidalVideoSearchItem | Record<string, any>;
	type?: string;
	cut?: boolean;
};

export type TidalAlbumResponse = TidalBaseResponse & {
	data?: TidalAlbumSearchItem & {
		duration?: number;
		streamReady?: boolean;
		payToStream?: boolean;
		adSupportedStreamReady?: boolean;
		djReady?: boolean;
		stemReady?: boolean;
		streamStartDate?: string;
		allowStreaming?: boolean;
		premiumStreamingOnly?: boolean;
		numberOfVolumes?: number;
		copyright?: string;
		upc?: string;
		vibrantColor?: string;
		mediaMetadata?: Record<string, any>;
		upload?: Record<string, any>;
		items?: TidalAlbumEntry[];
	};
};

export type TidalCoverItem = {
	id?: number;
	title?: string;
	url?: string;
	cover?: string;
	image?: string;
	[key: string]: any;
};

export type TidalCoverResponse = TidalBaseResponse & {
	covers?: TidalCoverItem[];
};

export type TidalArtistResponse = TidalBaseResponse & {
	artist?: TidalArtistRef & Record<string, any>;
	cover?: string | Record<string, any>;
};

export type TidalArtistReleasesResponse = TidalBaseResponse & {
	albums?: TidalAlbumSearchItem[] | TidalPagedItems<TidalAlbumSearchItem>;
	tracks?: TidalTrackItem[] | TidalPagedItems<TidalTrackItem>;
};

export type TidalSimilarArtistsResponse = TidalBaseResponse & {
	artists?: TidalArtistRef[] | TidalPagedItems<TidalArtistRef>;
};

export type TidalSimilarAlbumsResponse = TidalBaseResponse & {
	albums?: TidalAlbumSearchItem[] | TidalPagedItems<TidalAlbumSearchItem>;
};

export type TidalPlaylistResponse = TidalBaseResponse & {
	playlist?: TidalPlaylistSearchItem & Record<string, any>;
	items?: TidalAlbumEntry[];
};

export type TidalMixInfo = {
	id?: string;
	title?: string;
	subTitle?: string;
	description?: string;
	graphic?: string;
	images?: Record<string, any>;
	sharingImages?: Record<string, any>;
	mixType?: string;
	mixNumber?: number;
	contentBehavior?: string;
	master?: boolean;
	titleColor?: string;
	subTitleColor?: string;
	descriptionColor?: string;
	detailImages?: Record<string, any>;
	shortSubtitle?: string;
};

export type TidalMixResponse = TidalBaseResponse & {
	mix?: TidalMixInfo;
	items?: TidalTrackItem[];
};

export type TidalApiResponse =
	| TidalSearchTrackResponse
	| TidalSearchGroupedResponse
	| TidalInfoResponse
	| TidalTrackResponse
	| TidalAlbumResponse
	| TidalCoverResponse
	| TidalArtistResponse
	| TidalArtistReleasesResponse
	| TidalSimilarArtistsResponse
	| TidalSimilarAlbumsResponse
	| TidalPlaylistResponse
	| TidalMixResponse
	| (TidalBaseResponse & TidalApiJson);

export type TidalTrackSearchResponse = TidalSearchTrackResponse;

export type TidalLyricsResponse = TidalBaseResponse & {
	lyrics?: {
		providerCommontrackId?: string;
		providerLyricsId?: string;
		lyrics?: string;
		subtitles?: any[];
	};
};

export type SearchQueryOptions = {
	s?: string;
	a?: string;
	al?: string;
	v?: string;
	p?: string;
	i?: string;
	offset?: number;
	limit?: number;
};

export type SearchTrackOptions = {
	s: string;
	a?: never;
	al?: never;
	v?: never;
	p?: never;
	i?: never;
	offset?: number;
	limit?: number;
};

export type SearchIsrcOptions = {
	i: string;
	s?: never;
	a?: never;
	al?: never;
	v?: never;
	p?: never;
	offset?: number;
	limit?: number;
};

export type SearchArtistOptions = {
	a: string;
	s?: never;
	al?: never;
	v?: never;
	p?: never;
	i?: never;
	offset?: number;
	limit?: number;
};

export type SearchAlbumOptions = {
	al: string;
	s?: never;
	a?: never;
	v?: never;
	p?: never;
	i?: never;
	offset?: number;
	limit?: number;
};

export type SearchVideoOptions = {
	v: string;
	s?: never;
	a?: never;
	al?: never;
	p?: never;
	i?: never;
	offset?: number;
	limit?: number;
};

export type SearchPlaylistOptions = {
	p: string;
	s?: never;
	a?: never;
	al?: never;
	v?: never;
	i?: never;
	offset?: number;
	limit?: number;
};

export type MixTrackInput = {
	id: string | number;
	title: string;
	duration: number;
	artists: Array<{ name: string; id: string | number; picture?: string; type?: string }>;
};

export type ParsedMixTrack = {
	id: string | number;
	title: string;
	duration: number;
	artists: Array<{ name: string; id: string | number; picture?: string; type?: string }>;
};
