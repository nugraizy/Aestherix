import type {
	AnyMessageContent,
	BinaryNode,
	ButtonReplyInfo,
	DownloadableMessage,
	GroupMetadata,
	MessageGenerationOptions,
	MiscMessageGenerationOptions,
	WAGenericMediaMessage,
	WAMessage
} from '@adiwajshing/baileys';
import { proto } from '@adiwajshing/baileys';

export type StickerType = 'imageMessage' | 'videoMessage' | 'stickerAnimated' | undefined;
export type PrepareableMediaType =
	| 'imageMessage'
	| 'videoMessage'
	| 'audioMessage'
	| 'documentMessage'
	| 'stickerMessage'
	| 'locationMessage';
export type MessageTypes = keyof proto.IMessage;

export type MessageSendContent = AnyMessageContent;
export type MessageGenerated = proto.IWebMessageInfo;

export type PrepareMessageOptions = MessageGenerationOptions;
export type MessageSendOptions = MiscMessageGenerationOptions & GroupMetadata;
export type GenerationOptions = MiscMessageGenerationOptions;

export { BinaryNode, ButtonReplyInfo, DownloadableMessage, WAMessage, WAGenericMediaMessage };
