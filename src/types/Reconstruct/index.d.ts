import type { getDevice, MessageType } from 'baileys';
import type { GroupMetadata, GroupParticipant } from '../Groups/index';
import type { MessageGenerated, WAGenericMediaMessage } from '../Messages/index';
import type { ClientSocket, Context } from '../Core';
import type { MediaDataContext } from '../Socket';

/**
 * @deprecated Use `Context` from `../Core` instead. This type is kept for backward compatibility.
 */
export interface ReassignResult {
	message: MessageGenerated;
	isFromMe: boolean;
	from: string;
	isGroup: boolean;
	isBaileys: boolean;
	sender: string;
	prettyNumber: string;
	timeStamp: number;
	filename: string;
	groupMetadata: object;
	groupName: string;
	groupId: string;
	pushname: string;
	botNumber: string;
	isOwner: boolean;
	settings: object;
	type: MessageType;
	typeQuoted: string | undefined;
	typeSticker: string[];
	stickerAble: boolean;
	isAdmin?: boolean;
	adminGroups?: string[];
	participantsGroup?: string[];
	isBotAdmin?: boolean;
	body: string;
	args?: string[];
	cmd: string;
	isCmd: boolean;
	prefix: string | null;
	query?: string;
	isQuotedAudio: boolean;
	isQuotedSticker: boolean;
	isQuotedDocument: boolean;
	isMediaVid: boolean;
	isMediaImage: boolean;
	isMediaDocument: boolean;
	mention: string[];
	mediaData: MediaDataContext;
	extractMediaData: WAGenericMediaMessage;
	bodyQuoted: string;
	waitForInput?: (data: {
		expectedType: string[];
		message?: string;
		timeInSecond?: number;
		sendImpl?: () => Promise<void>;
	}) => Promise<{ message?: string | MessageGenerated; quoted?: MessageGenerated; timeout?: boolean; invalid?: boolean; command?: boolean }>;
	device: ReturnType<typeof getDevice>;
}

/**
 * @deprecated Use `Context.from()` instead.
 */
export type Reconstructuring = (m: MessageGenerated, client: ClientSocket, store?: object) => Promise<ReassignResult>;
