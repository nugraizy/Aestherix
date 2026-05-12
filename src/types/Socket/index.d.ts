import type { AuthenticationState, ConnectionState, makeWASocket, WAConnectionState } from 'baileys';

import type { ClientSocket, Context, Store } from '../Core';

type WASocket = ReturnType<typeof makeWASocket>;

export type { ClientSocket, Context, Store };
export type { ClientSocket as AdvancedClient };

export type MultiAuthState = { state: AuthenticationState; saveCreds: () => Promise<void> };
export type SingleAuthState = MultiAuthState;

export type ContextInfo = proto.IContextInfo;

type Parse = () => Promise<Context>;

export type MediaDataContext = Omit<ContextInfo, 'quotedMessage'> & {
	message: ContextInfo['quotedMessage'];
} & { extract: () => (proto.IWebMessageInfo & { parse: Parse }) | undefined };

export type ConnectionStates = ConnectionState;
export type WAConnectionStates = WAConnectionState;

declare global {
	var instance: string;
	var log: (typeof console)['log'];
	var __botName: string;
	interface String {
		toTime: () => string;
		toReadAble: () => string;
		separateCamel: () => string;
		capitalize: () => string;
		isExist: (...args: string[]) => boolean;
		mocking: () => string;
		formatHeaders: (simplify?: boolean) => string;
		formatForm: () => string;
		format: (formatter: '`' | '*') => string;
		replaceLast: (find: string, replace: string) => string;
		replaceFirst: (find: string, replace: string) => string;
		replaceAll: (find: string, replace: string) => string;
		parseNumber: () => string[];
		splitString: (opts: { length: number; join: string }) => string;
	}

	interface Number {
		toTime: () => string;
		toReadAble: () => string;
	}

	interface Array<T> {
		insert: (index: number, ...items: T[]) => T[];
		sortUnique: (key: string) => unknown[];
	}
}

export { DisconnectReason };
