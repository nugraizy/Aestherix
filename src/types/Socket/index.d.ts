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
}

export { DisconnectReason };
