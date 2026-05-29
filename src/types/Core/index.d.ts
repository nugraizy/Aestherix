import type { AuthenticationState, makeWASocket } from 'baileys';
import type { EventEmitter } from 'node:events';
import type { Transform } from 'node:stream';
import type { Buttons, Cards } from '../Commands/Interactive.d.ts';
import type {
	DownloadableMessage,
	MessageGenerated,
	MessageSendContent,
	MessageSendOptions,
	MessageTypes,
	WAMessage,
	WAMessageKey
} from '../Messages/index.d.ts';

type WASocket = ReturnType<typeof makeWASocket>;
type WASocketMethods = Omit<WASocket, 'ev' | 'ws' | 'end'>;

type ClientSocketState = 'disconnected' | 'connecting' | 'connected';
type ClientRole = 'primary' | 'sub';

type ExifMetadata = Partial<{
	id: string;
	packname: string;
	author: string;
}>;

type PrepareableMediaType =
	| 'imageMessage'
	| 'videoMessage'
	| 'audioMessage'
	| 'documentMessage'
	| 'stickerMessage'
	| 'locationMessage';
type StickerInputType = 'imageMessage' | 'videoMessage' | 'stickerAnimated';
type ProfilePictureType = 'no_crop' | 'no_stretch' | undefined;

interface ClientSocketOptions {
	role?: ClientRole;
	flags?: Record<string, unknown>;
	logger?: import('pino').Logger;
	browser?: [string, string, string];
	linkPreviewImageThumbnailWidth?: number;
	cachedGroupMetadata?: ((jid: string) => object | undefined) | null;
}

interface WaitMessageResult {
	update: (text: string) => Promise<void>;
}

declare class Native {
	button: import('../Commands/Interactive').InteractiveButtons['button'];
	destination(to: string): this;
	body(text: string): this;
	footer(text: string): this;
	header(text: string, media?: string | Buffer | null): this;
	buttons(...buttons: Buttons[]): this;
	mentions(jids: string[]): this;
	render(): Promise<MessageGenerated>;
	send(): Promise<void>;
}

declare class Carousel {
	button: import('../Commands/Interactive').InteractiveButtons['button'];
	destination(to: string): this;
	body(text: string): this;
	footer(text: string): this;
	header(text: string, media?: string | Buffer | null): this;
	cards(cards: Cards[]): this;
	mentions(jids: string[]): this;
	render(): Promise<MessageGenerated>;
	send(): Promise<void>;
}

export interface TemplateBuilderFactory {
	Native: typeof Native;
	Carousel: typeof Carousel;
}

export interface ClientSocket extends WASocketMethods {}
export declare class ClientSocket extends EventEmitter {
	constructor(auth: Auth, options?: ClientSocketOptions);

	get auth(): Auth;
	get sessionName(): string;
	get store(): Store | null;
	get socket(): WASocket | null;
	get state(): ClientSocketState;
	get role(): ClientRole;
	get options(): ClientSocketOptions;
	get phone(): string | null;
	get uptime(): string | null;
	get needsPairing(): boolean;
	get ev(): this;
	get TemplateBuilder(): TemplateBuilderFactory;
	get jidNormalizedUser(): (jid: string) => string;

	connect(options?: { prisma?: unknown; store?: Store }): Promise<this>;
	disconnect(): Promise<void>;
	resetSession(prisma: unknown): Promise<void>;

	generateMessageID(): string;
	send(jid: string, message: MessageSendContent, options?: MessageSendOptions): Promise<MessageGenerated>;
	reply(jid: string, text: string, quoted?: WAMessage): Promise<MessageGenerated>;
	relay(jid: string, message: object, options?: object): Promise<void>;

	prepareMedia(media: string | Buffer, type: PrepareableMediaType, opts?: object): Promise<MessageGenerated>;
	applyExif(buffer: Buffer, metadata?: ExifMetadata): Promise<Buffer>;
	prepareSticker(media: Buffer | string, type: StickerInputType, exif?: ExifMetadata): Promise<Buffer>;

	downloadMediaMessage(media: MessageGenerated, typeDownloadable?: 'buffer'): Promise<Buffer>;
	downloadMediaMessage(media: MessageGenerated, typeDownloadable: 'stream'): Promise<Transform>;
	downloadAndSaveMediaMessage(media: DownloadableMessage, path: string, type: MessageTypes): Promise<string>;

	waitMessage(jid: string, message: string, quoted?: WAMessage): Promise<WaitMessageResult>;
	edit(jid: string, message: string, key: WAMessageKey): Promise<void>;

	generateProfilePicture(media: Buffer | string, type?: ProfilePictureType): Promise<{ image: Buffer }>;
	updateProfilePicture(jid: string, media: Buffer | string, option?: ProfilePictureType): Promise<void>;
	setStatus(status: string): Promise<unknown>;

	decodeJid(jid: string): string;
	resolveJid(input: string | number, target?: 'jid' | 'lid'): Promise<string | null>;
	clearType(type: string, mime?: string): string;

	buttonText(
		jid: string,
		contentText: string,
		footerText: string,
		buttons: object[],
		options?: object
	): Promise<MessageGenerated>;
	buttonDocument(
		jid: string,
		contentText: string,
		footerText: string,
		buttons: object[],
		media: Buffer | string,
		options?: object
	): Promise<MessageGenerated>;
	buttonLocation(
		jid: string,
		contentText: string,
		footerText: string,
		buttons: object[],
		media?: Buffer | string,
		options?: object
	): Promise<MessageGenerated>;

	updateGroup(
		jid: string,
		options: {
			action: 'add' | 'remove';
			participants: string[];
			admins: string[];
			force?: boolean;
			message?: WAMessage | null;
		}
	): Promise<unknown[]>;
	updateGroup(
		jid: string,
		options: { action: 'promote' | 'demote'; participants: string[]; admins: string[]; message?: WAMessage | null }
	): Promise<unknown[]>;
	updateGroup(jid: string, options: { action: 'subject' | 'description'; text: string }): Promise<unknown[]>;
	updateGroup(
		jid: string,
		options: { action: 'announcement' | 'not_announcement' | 'locked' | 'unlocked' }
	): Promise<unknown[]>;
	updateGroup(jid: string, options: { action: 'retrieve' | 'revoke' }): Promise<unknown[]>;
	sendPresenceUpdate(type: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused', jid?: string): Promise<void>;
	searchMessage(jid: string, query: string): Promise<WAMessage[]>;
	getStoryParticipants(): Promise<string[]>;

	requestPairingCode(phoneNumber: string, clientId?: string): Promise<string>;
}

export declare class Auth {
	constructor(prisma: unknown, sessionName: string, options?: { mode?: 'multi' | 'single'; logger?: unknown });

	get sessionName(): string;
	get state(): AuthenticationState;
	get creds(): AuthenticationState['creds'];

	initialize(options?: { logger?: unknown }): Promise<this>;
	saveCreds(): Promise<void>;
	clearState(): Promise<void>;
}

export declare class Store {
	constructor(prisma: unknown, sessionName: string, options?: { logger?: unknown; resetOnStart?: boolean });

	initialize(): Promise<void>;
	bind(ev: EventEmitter): void;
	loadMessage(jid: string, id: string): Promise<WAMessage | undefined>;
	loadMessages(jid: string): WAMessage[];

	messages: Record<string, { array: WAMessage[] }>;
	contacts: Record<string, { verifiedName?: string; notify?: string }>;
	groupMetadata: Record<string, object>;
	localContacts: Record<string, { name: string; id: string }>;
}

export declare class Context {
	static from(rawMessage: WAMessage, client: ClientSocket, store?: Store, state?: unknown): Promise<Context | object>;

	get raw(): WAMessage;
	get message(): WAMessage;
	get from(): string;
	get isGroup(): boolean;
	get isFromMe(): boolean;
	get isBotInstance(): boolean;
	get sender(): string;
	get type(): string | null;
	get body(): string;
	get args(): string[];
	get cmd(): string;
	get prefix(): string | null;
	get isCmd(): boolean;
	get query(): string;
	get pushname(): string;
	get prettyNumber(): string;
	get isOwner(): boolean;
	get isBlocked(): boolean;
	get isBanned(): boolean;
	get settings(): object;
	get groupMetadata(): object;
	get groupName(): string;
	get groupId(): string;
	get adminGroups(): string[];
	get participantsGroup(): string[];
	get isAdmin(): boolean;
	get isBotAdmin(): boolean;
	get filename(): string;
	get device(): { name: string; isIos: boolean; isAndroid: boolean; isWeb: boolean; isDesktop: boolean };
	get isIos(): boolean;
	get isAndroid(): boolean;
	get isWeb(): boolean;
	get isDesktop(): boolean;
	get typeQuoted(): string | undefined;
	get mention(): string[];
	get bodyQuoted(): string;
	get mediaData(): object;
	get extractMediaData(): object;
	get isMediaImage(): boolean;
	get isMediaVid(): boolean;
	get isQuotedSticker(): boolean;
	get isQuotedDocument(): boolean;
	get isQuotedAudio(): boolean;
	get typeSticker(): string[];
	get stickerAble(): boolean;
	get isMediaDocument(): boolean;
	get timeStamp(): number;
	get botNumber(): string;
	get waitForInput(): (data: {
		expectedType: string[];
		message?: string;
		timeInSecond?: number;
		sendImpl?: () => Promise<void>;
	}) => Promise<{ message?: string | WAMessage; quoted?: WAMessage; timeout?: boolean; invalid?: boolean; command?: boolean }>;

	reply(text: string): Promise<MessageGenerated>;
	react(emoji: string): Promise<MessageGenerated>;
	send(content: MessageSendContent, options?: MessageSendOptions): Promise<MessageGenerated>;
	sendTo(jid: string, content: MessageSendContent, options?: MessageSendOptions): Promise<MessageGenerated>;
	delete(): Promise<MessageGenerated>;
}

export declare class Router {
	constructor(
		client: ClientSocket,
		options?: { prefix?: string; prefixMode?: string; prefixReg?: RegExp | null; commands?: object; aliases?: string[] }
	);

	get commands(): import('../../helper/modules/cache').Cache;
	set commands(value: import('../../helper/modules/cache').Cache);
	get aliases(): string[];
	set aliases(value: string[]);

	resolve(
		body: string
	): { command: object; args: string[]; cmdName: string; prefix: string; query: string; isEval: boolean } | null;
	isBlocked(command: { name: string; category: string }): boolean;
	checkCooldown(sender: string, commandName: string, cooldown: number): { onCooldown: boolean; remaining: number };
	updatePrefix(config: { mode: string; value: string; regex: RegExp | null }): void;
	trackUsage(commandName: string): Promise<void>;
	loadUsage(): Promise<void>;
}

export declare class MessageHandler {
	constructor(
		client: ClientSocket,
		options: { router: Router; store: Store; configuration?: object; options?: { flags?: object } }
	);

	get router(): Router;
	handle(upsert: { messages: WAMessage[]; type: string }): Promise<void>;
}

export declare class ConnectionHandler {
	constructor(client: ClientSocket, options: { configuration?: object; options?: object });

	handle(update: { connection?: string; lastDisconnect?: object; receivedPendingNotifications?: boolean }): Promise<void>;
}

export declare class EventHandler {
	constructor(client: ClientSocket, options: { router: Router; store: Store; configuration?: object; options?: object });

	bind(): void;
}

export declare class CommandLoader extends EventEmitter {
	constructor(options?: { commands?: object; aliases?: string[]; flags?: object });

	get commands(): import('../../helper/modules/cache').Cache;
	get aliases(): string[];
	get ready(): boolean;

	load(options?: object): Promise<void>;
	watch(): void;

	on(event: 'added', listener: (data: { name: string; file: string }) => void): this;
	on(event: 'changed', listener: (data: { name: string; file: string }) => void): this;
	on(event: 'removed', listener: (data: { name: string }) => void): this;
	on(event: 'error', listener: (data: { file: string; reason: string }) => void): this;
}

export declare class Manager {
	clients: Map<string, ClientSocket>;

	add(name: string, client: ClientSocket): void;
	get(name: string): ClientSocket | null;
	has(name: string): boolean;
	remove(name: string): void;
	list(): Array<{ name: string; client: ClientSocket }>;
	findByPhone(phone: string): { name: string; client: ClientSocket } | null;
	connectAll(): Promise<void>;
	disconnectAll(): Promise<void>;
}

export declare const manager: Manager;

export declare class MqttBridge {
	constructor(options?: object);
	connect(): void;
	bindMessageHandler(): void;
}

export declare class WebhookServer {
	constructor(options?: object);
	start(port?: number): void;
	handleCommitEvent(commitInfo: object): Promise<void>;
}

export declare class Cli {
	constructor();

	get flags(): Record<string, unknown>;
	get sessionName(): string;
	get input(): string[];
}

export declare class Logger {
	constructor(options?: { name?: string; muted?: boolean });

	get name(): string | null;
	get muted(): boolean;

	mute(): void;
	unmute(): void;
	color(text: string, colorName: string): string;
	info(...args: unknown[]): string | undefined;
	warning(...args: unknown[]): string | undefined;
	error(...args: unknown[]): string | undefined;
	json(
		...args: [...objects: unknown[], options?: { format?: boolean; pretty?: boolean; language?: string }]
	): string | undefined;
	prettyCode(...args: [...codes: string[], options?: { language?: string }]): string | undefined;
}

export declare function boot(options: {
	cli: Cli;
	OPTIONS: Record<string, unknown>;
	store: Store;
	sessionName: string;
}): Promise<{
	clientSocket: ClientSocket;
	auth: Auth;
	eventHandler: EventHandler;
	commandLoader: CommandLoader;
	router: Router;
}>;

export declare function checkNetwork(): Promise<boolean>;
export declare function initContact(store: Store, contacts: object[]): void;
export declare function updateContact(store: Store, update: object[]): void;
export declare function patchMessage(message: WAMessage): WAMessage;

export declare class Configuration {
	registry: {
		commands: Cache;
		aliases: string[];
		commandUsage: Cache;
		disabledCommands: Set<string>;
		menu: Record<string, unknown>;
		menuStr: string;
		loadPromise: Promise<void> | null;
	};

	flags: Record<string, boolean | string>;
	cli: Record<string, unknown>;
	input: Cache;

	groups: {
		metadata: Cache;
		settings: Cache;
	};

	users: {
		afk: Cache;
		info: Cache;
	};

	prefix: {
		mode: string;
		values: string[];
		regex: RegExp | null;
		default: string;
		config: Record<string, unknown>;
	};

	owners: string[];
	botJid: string;
	blocklist: string[];
	bannedlist: string[];

	games: {
		tebakGambar: Cache;
		sudoku: Cache;
		akinator: Cache;
		tictactoe: Cache;
		word: Cache;
		werewolf: Cache;
		wordle: Cache;
	};

	timers: {
		tebakGambar: Cache;
		sudoku: Cache;
		anonymous: Cache;
		word: Cache;
		from: string[];
		freegame: unknown;
		spotifyPlaybacks: Cache;
	};

	anonymous: {
		sessions: Cache;
		messages: Cache;
	};

	pinterest: {
		id: string | null;
		images: Cache;
	};

	dashboard: {
		io: unknown;
		expressInstances: Cache;
	};

	charAI: Cache;
	userLimit: Cache;

	mqtt: unknown;
	instagram: import('../../utils/instagram/instagram.js').InstagramApi;
	isInstagramInitiated: boolean;

	settings: Record<string, unknown>;
	defaultLimit: number;
	packname: string;
	author: string;
	logger_theme: string;

	isFirstConnectionForCache: boolean;
	isFirstConnection: boolean;
	isConnected: boolean;

	core: Record<string, unknown>;
}

export declare const configuration: Configuration;
