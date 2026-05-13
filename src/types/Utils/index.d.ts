/**
 * @deprecated These types are now part of ClientSocket in '../Core'.
 * Import from '../Core' instead.
 */

import type { ClientSocket } from '../Core';

export type PrepareMedia = ClientSocket['prepareMedia'];
export type AppliedExif = ClientSocket['applyExif'];
export type SendMessage = ClientSocket['send'];
export type ReplyMessage = ClientSocket['reply'];
export type PrepareSticker = ClientSocket['prepareSticker'];
export type DownloadAndSave = ClientSocket['downloadAndSaveMediaMessage'];
export type DownloadMedia = ClientSocket['downloadMediaMessage'];
export type SendButtonText = ClientSocket['buttonText'];
export type SendButtonDocument = ClientSocket['buttonDocument'];
export type SendButtonLocation = ClientSocket['buttonLocation'];
export type SetInfo = ClientSocket['setStatus'];
export type UpdateGroup = ClientSocket['updateGroup'];
export type SearchMessage = ClientSocket['searchMessage'];
export type DecodeJid = ClientSocket['decodeJid'];
export type ClearType = ClientSocket['clearType'];
export type GenerateMessageID = ClientSocket['generateMessageID'];
export type UpdateProfilePicture = ClientSocket['updateProfilePicture'];
export type WaitMessage = ClientSocket['waitMessage'];
export type EditMessage = ClientSocket['edit'];
export type RelayMessage = ClientSocket['relay'];
export type GetStoryParticipants = ClientSocket['getStoryParticipants'];

export type ExifMetadata = Partial<{ id: string; packname: string; author: string }>;

/**
 * @deprecated Use `ClientSocket` directly. The assign() pattern has been removed.
 */
export type AssignedClient = ClientSocket;

/**
 * @deprecated Use `ClientSocket` directly.
 */
export type AssignSocketClient = (client: unknown) => unknown;
