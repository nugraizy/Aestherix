import { generateWAMessageFromContent } from 'baileys';
import type { FileTypeResult } from 'file-type';
import type { MessageGenerated } from '../Messages/index.d.ts';

type MediaType = 'videoMessage' | 'imageMessage';
type Media = string | Buffer | undefined | null;
type Rows = { header: string; title: string; description: string; id: string };
type Sections = { title: string; highlight_label: string; rows: Rows[] };
export type Cards = { body: string | null; footer: string | null; title: string | null; buttons: Buttons[] } & Partial<{
	header: string | Buffer;
}>;
export type Buttons = {
	name:
		| 'cta_copy'
		| 'quick_reply'
		| 'cta_url'
		| 'single_select'
		| 'cta_call'
		| 'cta_reminder'
		| 'cta_cancel_reminder'
		| 'address_message'
		| 'send_location'
		| 'webview';
	buttonParamsJson: string;
};

export declare class InteractiveButtons {
	button: {
		copy: (params: { display: string; code: string }) => Buttons;
		reply: (params: { display: string; id: string }) => Buttons;
		url: (params: { display: string; url: string }) => Buttons;
		list: (params: { display: string; sections: Sections }) => Buttons;
		call: (params: { display: string; phoneNumber: string }) => Buttons;
		setReminder: (params: { display: string }) => Buttons;
		cancelReminder: (params: { display: string }) => Buttons;
		address: (params: { display: string }) => Buttons;
		location: (params: { display: string }) => Buttons;
		webview: (params: { title: string; url: string; inApp: boolean }) => Buttons;
	};
}

declare class Carousel extends InteractiveButtons {
	constructor();

	render(): Promise<ReturnType<typeof generateWAMessageFromContent>>;

	body(text: string): Carousel;

	footer(text: string): Carousel;

	header(text: string, media: Media): Carousel;

	getMessageType(media: Buffer): { mime: FileTypeResult['mime']; messageType: MediaType };

	prepareGif(media: Buffer, messageType: MediaType): MessageGenerated;

	cards(cards: Cards): Carousel;

	mentions(jids: string[]): Carousel;

	send(): Promise<void>;

	destination(to: string): Carousel;
}

declare class Native extends InteractiveButtons {
	constructor();

	render(): Promise<ReturnType<typeof generateWAMessageFromContent>>;

	body(text: string): Native;

	footer(text: string): Native;

	header(text: string, media: Media): Native;

	getMessageType(media: Buffer): { mime: FileTypeResult['mime']; messageType: MediaType };

	prepareGif(media: Buffer, messageType: MediaType): MessageGenerated;

	buttons(...buttons: Buttons[]): Native;

	mentions(jids: string[]): Native;

	send(): Promise<void>;

	destination(to: string): Native;
}

export declare class TemplateBuilder {
	Carousel: typeof Carousel;
	Native: typeof Native;
}
