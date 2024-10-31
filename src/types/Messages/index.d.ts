import type {
	AnyMessageContent,
	BinaryNode,
	ButtonReplyInfo,
	DownloadableMessage,
	MessageGenerationOptions,
	MiscMessageGenerationOptions,
	WAGenericMediaMessage,
	WAMessage
} from 'baileys';
import { proto } from 'baileys';

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
export type MessageSendOptions = MiscMessageGenerationOptions;
export type GenerationOptions = MiscMessageGenerationOptions;

export { BinaryNode, ButtonReplyInfo, DownloadableMessage, WAMessage, WAGenericMediaMessage };
