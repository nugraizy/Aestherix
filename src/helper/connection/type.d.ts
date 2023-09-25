type Client = import('@adiwajshing/baileys').WASocket;
type AdvancedClient = { [_: string]: Client & import('../modules/utils.js').AdvancedClient };

type Store = import('@adiwajshing/baileys').WAMemoryStore;
type SingleAuthState = { state: import('@adiwajshing/baileys').AuthenticationState; saveState: () => void };

type Disconnect = import('@adiwajshing/baileys').ConnectionState;
type ConnectionState = import('@adiwajshing/baileys').WAConnectionState;

declare global {
	var client: AdvancedClient;
	var store: Store;
	var botNum: string;
}

export { AdvancedClient, Client, ConnectionState, Disconnect, SingleAuthState, Store };
