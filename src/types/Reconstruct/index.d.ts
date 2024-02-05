import type { GroupMetadata, GroupParticipant } from '../Groups/index';
import type { MessageGenerated, WAGenericMediaMessage } from '../Messages/index';
import type { AdvancedClient, MediaDataContext, Store } from '../Socket';

export {};

interface GroupMetadataParsed {
	ownerGroup: string;
	rawParticipants: GroupParticipant[];
	adminGroups: string[];
	participantsGroup: string[];
}

type TypeSticker = 'imageMessage' | 'videoMessage' | 'stickerMessage';

export interface ReassignResult {
	message: MessageGenerated;
	isFromMe: boolean;
	from: string;
	isGroup: boolean;
	isBaileys: boolean;
	isDisappearingChat: boolean;
	sender: string;
	prettyNumber: string;
	timeStamp: number;
	filename: string;
	groupMetadata: GroupMetadataParsed & GroupMetadata;
	groupSettings: Record<string, unknown>;
	groupName: string;
	groupId: string;
	isGroupOwner: boolean;
	pushname: string;
	botNumber: string;
	ownerNumbers: string[];
	isOwner: boolean;
	settings: any;
	type: string;
	typeQuoted: string | undefined;
	typeSticker: TypeSticker;
	stickerAble: boolean;
	isAdmin?: boolean;
	rawParticipants?: object[] | undefined;
	adminGroups?: string[] | undefined;
	participantsGroup?: string[] | undefined;
	ownerGroups?: string | undefined;
	isBotAdmin?: boolean | undefined;
	body: string;
	args?: string[] | undefined;
	cmd: string;
	isCmd: boolean;
	prefix: string;
	query?: string | undefined;
	isMedia: boolean;
	isQuotedImage: boolean;
	isQuotedVideo: boolean;
	isQuotedAudio: boolean;
	isQuotedContact: boolean;
	isQuotedContactsArray: boolean;
	isQuotedDocument: boolean;
	isQuotedLiveLocation: boolean;
	isQuotedLocation: boolean;
	isQuotedSticker: boolean;
	isMediaVid: boolean;
	isMediaImage: boolean;
	isMediaDocument: boolean;
	isSticker: boolean;
	isAudio: boolean;
	isContact: boolean;
	isContactsArray: boolean;
	isDocument: boolean;
	isLocation: boolean;
	isLiveLocation: boolean;
	isViewOnce: boolean;
	isViewOnceImage: boolean;
	isViewOnceVideo: boolean;
	isQuotedViewOnce: boolean;
	isQuotedViewOnceImage: boolean;
	isQuotedViewOnceVideo: boolean;
	typeViewOnce: string;
	mention: string[];
	mediaData: MediaDataContext;
	extractMediaData: WAGenericMediaMessage;
	bodyQuoted: string;
	waitForInput?: (
		client: AdvancedClient,
		data: {
			expectedType: string[];
			from: string;
			sender: string;
			message?: string;
			timeInSecond?: number;
		}
	) => Promise<
		Partial<{
			message: string | MessageGenerated;
			quoted: MessageGenerated;
			timeout: boolean;
			invalid: boolean;
		}>
	>;
}

export type Reconstructuring = (m: MessageGenerated, client: AdvancedClient, store?: Store) => Promise<ReassignResult>;
