import type { ReassignResult } from '../Reconstruct';
import type { AdvancedClient, SingleAuthState, Store } from '../Socket';

export type CommandProps = {
	/**
	 *  Your plugins name
	 */
	name: string;

	/**
	 *  Your plugins description
	 */
	description: number;

	/**
	 *  Your plugins category
	 */
	category: string;

	/**
	 *  Your plugins usage exmple
	 */
	usage: string;

	/**
	 *  Your plugins aliases
	 */
	aliases: string[];

	/**
	 *  Your plugins cooldown
	 */
	cooldown: number;

	/**
	 *  Your plugins limit
	 */
	limit: number;

	/**
	 *  Your plugins status
	 */
	status: 'enable' | 'disable';

	/**
	 *  Your plugins restrict mode
	 */
	restrict?: boolean;

	/**
	 *  Your plugins callbacks
	 */
	run: (ctx: ReassignResult & { state: SingleAuthState['state'] }, client: AdvancedClient, store: Store) => Promise<unknown>;
};
