import type {
	AuthenticationState,
	ConnectionState,
	proto,
	WAConnectionState,
	WASocket,
	WAMemoryStore
} from '@adiwajshing/baileys';

import type { AssignedClient } from '../Utils';

export type ClientSocket = WASocket;
export type Client = { [key: string]: ClientSocket };
export type AdvancedClient = { [key: string]: ClientSocket & AssignedClient };

export type Store = WAMemoryStore;
export type SingleAuthState = { state: AuthenticationState; saveState: () => void };

export type ContextInfo = proto.IContextInfo;

export type MediaDataContext = Omit<ContextInfo, 'quotedMessage'> & {
	message: ContextInfo['quotedMessage'];
};

export type ConnectionStates = ConnectionState;
export type WAConnectionStates = WAConnectionState;

declare global {
	var client: AdvancedClient;
	var store: Store;
	var botNum: string;
	var log: (typeof console)['log'];
	interface String {
		/**
		 * Convert string to time.
		 * @returns string
		 */
		toTime: () => string;

		/**
		 * Convert string to readable.
		 * @returns string
		 */
		toReadAble: () => string;

		/**
		 * Convert string to camel case.
		 * @returns string
		 */
		separateCamel: () => string;

		/**
		 * Convert string to capitalize.
		 * @returns string
		 */
		capitalize: () => string;

		/**
		 * Check on string is exist.
		 * @returns boolean
		 */
		isExist: (...args: string[]) => boolean;

		/**
		 * Mocking string.
		 * @returns string
		 */
		mocking: () => string;

		/**
		 * Format headers.
		 * @returns string
		 */
		formatHeaders: () => string;

		/**
		 * Replace last string.
		 * @returns string
		 */
		replaceLast: (find: string, replace: string) => string;

		/**
		 * Replace first string.
		 * @returns string
		 */
		replaceFirst: (find: string, replace: string) => string;

		/**
		 * Replace all string.
		 * @returns string
		 */
		replaceAll: (find: string, replace: string) => string;
	}

	interface Number {
		/**
		 * Convert number to time
		 * @returns string
		 */
		toTime: () => string;

		/**
		 * Convert number to readable
		 * @returns string
		 */
		toReadAble: () => string;
	}

	interface Array<T> {
		/**
		 * Parse number
		 * @returns string[]
		 */
		parseNumber: () => string[];

		/**
		 * Insert item to array
		 * @returns string[]
		 */
		insert: (index: number, ...items: T[]) => T[];
	}
}

export { DisconnectReason };
