declare namespace InstagramModule {
	/**
	 * Configuration object for Instagram.
	 */
	export interface Config {
		uuid: string;
		deviceId: string;
		cookie: string;
	}

	/**
	 * Interface for the Instagram API.
	 */
	export interface InstagramAPI {
		/**
		 * Initialize the Instagram API.
		 * @returns Returns an InstagramAPI instance with 'init' removed.
		 */
		init(): Omit<InstagramAPI, 'init'>;

		/**
		 * Get the Instagram API's configuration.
		 */
		account: {
			/**
			 * Login to Instagram.
			 * @returns Returns the Instagram API's configuration.
			 */
			login: () => Promise<InstagramAPIOmitted>;

			/**
			 * Parse the cookie.
			 * @returns Returns the parsed cookie.
			 */
			parseCookie: () => string;

			/**
			 * Write the login info.
			 */
			writeLoginInfo: () => void;
		};

		/**
		 * Download media.
		 */
		download: {
			/**
			 * Download a post.
			 * @param args
			 * @returns
			 */
			post: (...args: string[]) => Promise<import('../../types/Utils/instagram').InstagramPosts>;
		};

		/**
		 * Search utilities.
		 */
		search: {
			/**
			 * Search for a user.
			 * @param args
			 * @returns
			 */
			user: (...args: string[]) => Promise<import('../../types/Utils/instagram').InstagramUser>;

			/**
			 * Search for users.
			 * @param args
			 * @returns
			 */
			users: (...args: string[]) => Promise<import('../../types/Utils/instagram').InstagramUsers>;

			/**
			 * Search for a higlight.
			 * @param args
			 * @returns
			 */
			highlight: (...args: string[]) => Promise<import('../../types/Utils/instagram').InstagramHighlights>;

			/**
			 * Search for a story/stories.
			 * @param args
			 * @returns
			 */
			story: (...args: string[]) => Promise<import('../../types/Utils/instagram').InstagramStory>;

			/**
			 * Search for a hashtag.
			 * @param args
			 * @returns
			 */
			hashtag: (...args: string[]) => Promise<import('../../types/Utils/instagram').InstagramHashtags>;
		};
	}

	interface InstagramAPIOmitted extends Omit<InstagramAPI, 'account' | 'init'> {
		account: {
			parseCookie: () => string;
			writeLoginInfo: () => void;
		};
	}

	/**
	 * Class constructor for the Instagram class.
	 * @param username - The username.
	 * @param password - The password.
	 * @param config - The configuration object.
	 */
	export class Instagram {
		constructor(username: string, password: string, config: Config);

		/**
		 * Create an InstagramAPI instance with 'init' removed.
		 * @param username - The username.
		 * @param password - The password.
		 * @param config - The configuration object.
		 * @returns An InstagramAPI instance with 'init' removed.
		 */
		static init(username: string, password: string, config: Config): Omit<InstagramAPI, 'init'>;
	}
}

declare module 'instagram' {
	export = InstagramModule;
}
