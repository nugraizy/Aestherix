export interface InstagramHashtags {
	[key: string]: Partial<Hashtags & { error: string }>;
}

export type InstagramHighlights = {
	[key: string]: Partial<HighlightsUsers & { error: string }>;
};

export type InstagramPosts = {
	[key: string]: Partial<InstaPost & { error: string }>;
};

export type InstagramStory = {
	[key: string]: Partial<StoryUsers & { error: string }>;
};

export type InstagramUser = {
	[key: string]: Partial<DetailUsers & { error: string }>;
};

export type InstagramUsers = {
	[key: string]: Partial<SearchUser & { error: string }>;
};

interface Hashtags {
	totalPostFormatted: string;
	totalPostRaw: number;
	thumbnail: string;
	posts: HashtagsPost[];
}

interface HashtagsPost {
	username: string;
	fullName: string;
	avatarUrl: string;
	isPrivate: boolean;
	caption: string;
	published: number;
	code: string;
	source: string;
	commentCount: number;
	likeCount: number;
	media: HighlightMedia[];
}

interface HighlightMedia {
	isVideo: boolean;
	url: string;
	duration?: number;
}

interface HighlightsUsers {
	user: HighlightsUser;
	highlights: Highlights[];
}

interface Highlights {
	thumbnail: string;
	dataHighlight: DataHighlight[];
}

interface DataHighlight {
	parentId: string;
	mediaId: string;
	mimetype: Mimetype;
	takenAt: number;
	type: Type;
	url: string;
	dimensions: HighlightsDimensions;
}

interface HighlightsDimensions {
	height: number;
	width: number;
}

enum Mimetype {
	ImageJPEG = 'image/jpeg',
	VideoMp4 = 'video/mp4'
}

enum Type {
	Image = 'image',
	Video = 'video'
}

interface HighlightsUser {
	id: string;
	biography: string;
	followers: number;
	following: number;
	fullName: string;
	highlightCount: number;
	isBusinessAccount: boolean;
	isRecentUser: boolean;
	accountCategory: null;
	linkedFacebookPage: null;
	isPrivate: boolean;
	isVerified: boolean;
	profilePic: string;
	profilePicHD: string;
	username: string;
	postsCount: number;
	posts: HighlightsPost[];
}

interface HighlightsPost {
	id: string;
	shortCode: string;
	url: string;
	dimensions: HighlightsDimensions;
	imageUrl: string;
	isVideo: boolean;
	caption: string;
	commentsCount: number;
	commentsDisabled: boolean;
	timestamp: number;
	likesCount: number;
	location: null;
	children: any[];
}

interface InstaPost {
	username: string;
	fullName: string;
	isPrivate: boolean;
	isVerified: boolean;
	likeCount: number;
	takenAt: number;
	commentCount: number;
	captions: string;
	post: PostElement[];
}

interface PostElement {
	isVideo: boolean;
	url: string;
}

interface StoryUsers extends Omit<DetailUsers, 'posts'> {
	username: string;
	fullName: string;
	totalStories: number;
	stories: Story[];
}

interface Story {
	isVideo: boolean;
	id: string;
	url: string;
}

interface SearchUser {
	id: string;
	fullName: string;
	username: string;
	isVerified: boolean;
	isPrivate: boolean;
	profilePic: string;
}

interface DetailUsers extends User {
	biography: string;
	followers: number;
	following: number;
	highlightCount: number;
	isBusinessAccount: boolean;
	isRecentUser: boolean;
	accountCategory: null;
	linkedFacebookPage: null;
	isPrivate: boolean;
	profilePicHD: string;
	postsCount: number;
	posts: UserPost[];
}

interface UserPost {
	id: string;
	shortCode: string;
	url: string;
	dimensions: UserPostDimensions;
	imageUrl: string;
	isVideo: boolean;
	caption: string;
	commentsCount: number;
	commentsDisabled: boolean;
	timestamp: number;
	likesCount: number;
	location: null;
	children: any[];
}

interface UserPostDimensions {
	height: number;
	width: number;
}
