import makeWASocket, { WALocationMessage } from 'baileys';
import type { Transform } from 'stream';
import { TemplateBuilder } from '../Commands/Interactive';
import type {
	BinaryNode,
	DownloadableMessage,
	GenerationOptions,
	MessageGenerated,
	MessageSendContent,
	MessageSendOptions,
	MessageTypes,
	PrepareableMediaType,
	PrepareMessageOptions,
	WAMessage,
	WAMessageKey
} from '../Messages';
import type { AdvancedClient, Client } from '../Socket';

export type ExifMetadata = Partial<{
	/**
	 * the id of the pack
	 */
	id: string;

	/**
	 * the name of the pack
	 */
	packname: string;

	/**
	 * the author of the pack
	 */
	author: string;
}>;

/**
 * Prepare message media before sending
 * @example
 * ```js
 * await client[session].prepareMedia(buffer, 'imageMessage', {})
 * ```
 */
export type PrepareMedia = (
	/**
	 * the media you want to prepare
	 */
	media: string | Buffer | { location: WALocationMessage },

	/**
	 * type of the media
	 */
	type: PrepareableMediaType,

	/**
	 * options
	 */
	options?: PrepareMessageOptions
) => Promise<MessageGenerated>;

/**
 * Applying exif to stickers
 * * @example ```js
 * await client[session].applyExif(buffer, { id: 'hello-world', packname: 'my-sticker' author: 'your-name' })
 * ```
 */
export type AppliedExif = (
	/**
	 * the buffer you want to apply the exif
	 */
	buffer: string | Buffer,

	/**
	 * the metadata of the exif
	 */
	metadata: ExifMetadata
) => Promise<Buffer>;

type Options = MessageSendOptions;

/**
 * Send message
 */
export type SendMessage = (
	/**
	 * destination of sending the message
	 */
	jid: string,

	/**
	 * the message object
	 */
	message: MessageSendContent,

	/**
	 * the options of send message
	 */
	options: Options
) => Promise<MessageGenerated>;

/**
 * Reply message
 * @example ```js
 * const from: '62xxxxxx@s.whatsapp.net',
 * const messageToQuote = message
 *
 * await client.instance.reply(from, 'Hello World!', messageToQuote)
 * ```
 */
export type ReplyMessage = (
	/**
	 * the destination to reply
	 */
	jid: string,
	/**
	 * the text message
	 */
	text: string,

	/**
	 * the message property you want to quote
	 */
	message: WAMessage
) => Promise<MessageGenerated>;

/**
 * Convert media into readable WhatsApp stickers
 */
export type PrepareSticker = (
	/**
	 * media of the message
	 */
	media: Buffer | string,

	/**
	 * filename of the media
	 */
	filename: string,

	/**
	 * type of the sticker
	 */
	type: StickerType,

	/**
	 * the exif metadata
	 */
	exif: ExifMetadata
) => Promise<Buffer>;

/**
 * Download WhatsApp media and save it to local
 */
export type DownloadAndSave = (
	/**
	 * the media of the message
	 */
	media: DownloadableMessage,

	/**
	 * path to save the message
	 */
	path: string,

	/**
	 * the types of the message
	 */
	type: MessageTypes
) => Promise<string>;

/**
 * Download WhatsApp media and returns buffer or stream
 */
export type DownloadMedia = {
	(media: MessageGenerated, typeDownloadable: 'stream'): Promise<Transform>;
	(media: MessageGenerated, typeDownloadable: 'buffer'): Promise<Buffer>;
};

/**
 * Send regular button text
 */
export type SendButtonText = (
	/**
	 * destination of the message
	 */
	jid: string,

	/**
	 * text in content
	 */
	contentText: string,

	/**
	 * text in footer
	 */
	footerText: string,

	/**
	 * buttons to send
	 */
	buttons: ButtonReplyInfo[],

	/**
	 * the options of send message
	 */
	options?: GenerationOptions
) => Promise<MessageGenerated>;

/**
 * Send button with a document attached
 */
export type SendButtonDocument = (
	/**
	 * destination of the message
	 */
	jid: string,

	/**
	 * text in content
	 */
	contentText: string,

	/**
	 * text in footer
	 */
	footerText: string,

	/**
	 * buttons to send
	 */
	buttons: ButtonReplyInfo[],

	/**
	 * media to send
	 */
	media: string | Buffer,

	/**
	 * the options of send message
	 */
	options?: GenerationOptions
) => Promise<MessageGenerated>;

/**
 * Send button with a location attached
 */
export type SendButtonLocation = (
	/**
	 * destination of the message
	 */
	jid: string,

	/**
	 * text in content
	 */
	contentText: string,

	/**
	 * text in footer
	 */
	footerText: string,

	/**
	 * buttons to send
	 */
	buttons: ButtonReplyInfo[],

	/**
	 * media as thumbnail
	 */
	media?: string | Buffer,

	/**
	 * the options of send message
	 */
	options?: GenerationOptions
) => Promise<MessageGenerated>;

/**
 * Set info bot
 */
export type SetInfo = (
	/**
	 * the string you want to set as info
	 */
	status: string
) => Promise<BinaryNode>;

/**
 * Update group settings & participants
 */
export type UpdateGroup = (
	/**
	 * destination of update
	 */
	jid: string,

	/**
	 * type of the update
	 */
	update: import('../../helper/misc/wa_data/constants').UpdateType,

	/**
	 * participants of sending the update
	 */
	participants: string[],

	/**
	 * admins of the group
	 */
	adminGroups: string[],

	_: {
		/**
		 * text if there is a response
		 */
		texts: string;

		/**
		 * force update if the admins in participants are included
		 */
		force: boolean;

		/**
		 * quoted of the original command
		 */
		message: GenerationOptions['quoted'] | null;
	}
) => Promise<unknown>;

/**
 * Search messages in a chat
 */
export type SearchMessage = (
	/**
	 * destination of update
	 */
	jid: string,

	/**
	 * the keyword of the message
	 */
	query: string
) => Promise<proto.IWebMessageInfo[]>;

/**
 * Decode jid
 */
export type DecodeJid = (
	/**
	 * the jid you want to decode
	 */
	jid: string
) => /** The parsed jid */ string;

/**
 * Clear type message and return the real type of media
 */
export type ClearType = (
	/**
	 * type message
	 */
	type: 'imageMessage' | 'videoMessage' | 'stickerMessage' | 'documentMessage' | 'documentWithCaptionMessage',
	/**
	 * mime of the type
	 */
	mime: 'image' | 'video' | ''
) => /** The parsed jid */ 'image' | 'video';

/**
 * Get story participants
 */
export type GetStoryParticipants = (client: AdvancedClient) => Promise<string[]>;

export type AssignSocketClient = (client: Client) => AdvancedClient;

export type GenerateMessageID = () => string;

export type UpdateProfilePicture = (jid: string, media: Buffer, type: 'no_crop' | 'no_stretch' | undefined) => Promise<void>;

export type UpdateMessage = (message: string) => Promise<void>;

export type WaitMessage = (jid: string, message: string, quotedMessage: WAMessage) => Promise<{ update: UpdateMessage }>;

export type EditMessage = (jid: string, message: string, key: WAMessageKey) => Promise<void>;

export type RelayMessage = ReturnType<typeof makeWASocket>['relayMessage'];

export type AssignedClient = {
	prepareMedia: PrepareMedia;
	applyExif: AppliedExif;
	send: SendMessage;
	reply: ReplyMessage;
	prepareSticker: PrepareSticker;
	downloadAndSaveMediaMessage: DownloadAndSave;
	downloadMediaMessage: DownloadMedia;
	buttonText: SendButtonText;
	buttonDocument: SendButtonDocument;
	buttonLocation: SendButtonLocation;
	setStatus: SetInfo;
	updateGroup: UpdateGroup;
	searchMessage: SearchMessage;
	decodeJid: DecodeJid;
	clearType: ClearType;
	TemplateBuilder: TemplateBuilder;
	getStoryParticipants: GetStoryParticipants;
	generateMessageID: GenerateMessageID;
	updateProfilePicture: UpdateProfilePicture;
	waitMessage: WaitMessage;
	edit: EditMessage;
	relay: RelayMessage;
};
