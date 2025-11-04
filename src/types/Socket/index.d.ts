import type { AuthenticationState, ConnectionState, makeInMemoryStore, makeWASocket, WAConnectionState } from 'baileys';

import type { ReassignResult } from '../Reconstruct';
import type { AssignedClient } from '../Utils';

type WAMemoryStore = ReturnType<typeof makeInMemoryStore>;

export type ClientSocket = ReturnType<typeof makeWASocket>;
export type Client = { instance: ClientSocket };
export type AdvancedClient = { instance: ClientSocket & AssignedClient };

export type Store = WAMemoryStore & { localContacts: { [_: string]: { name: string; id: string } } };
export type MultiAuthState = { state: AuthenticationState; saveCreds: () => Promise<void> };

export type ContextInfo = proto.IContextInfo;

type Parse = () => Promise<ReassignResult>;

export type MediaDataContext = Omit<ContextInfo, 'quotedMessage'> & {
	message: ContextInfo['quotedMessage'];
} & { extract: () => (proto.IWebMessageInfo & { parse: Parse }) | undefined };

export type ConnectionStates = ConnectionState;
export type WAConnectionStates = WAConnectionState;

declare global {
	var client: AdvancedClient;
	var store: Store;
	var instance: string;
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
		 * @param simplify either with backtick or not
		 * @returns string
		 */
		formatHeaders: (simplify: boolean) => string;

		/**
		 * Format forms.
		 * @returns string
		 */
		formatForm: () => string;

		/**
		 * Format strings.
		 * @param formatter
		 * @returns
		 */
		format: (formatter: '`' | '*') => string;

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

		/**
		 * Parse number
		 * @returns string[]
		 */
		parseNumber: () => string[];

		/**
		 * Split string based on starting point and join it with another string
		 * @returns string
		 */
		splitString: ({ length: number, join: string }: { length: 3; join: '-' }) => string;
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
		 * Insert item to array
		 * @returns string[]
		 */
		insert: (index: number, ...items: T[]) => T[];

		/**
		 * Sort Array into unique values
		 * @returns unknown[]
		 */
		sortUnique: (key: string) => unknown[];
	}
}

export { DisconnectReason };
