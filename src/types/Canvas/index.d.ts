export type InitGithubGraph<T> = (
	/**
	 * Github username
	 */
	username: string,

	/**
	 * Options
	 */
	opts: Partial<{
		/**
		 * The theme of the graph
		 */
		theme: 'DRACULA' | 'DEFAULT';

		/**
		 * Whether to round the lines or not
		 */
		round: boolean;

		/**
		 * Whether to include the background mesh or not
		 */
		backgroundMesh: boolean;
	}>
) => Promise<T>;
export type GithubGraph<T> = () => Promise<T>;
export type BufferGraph = () => Buffer;
