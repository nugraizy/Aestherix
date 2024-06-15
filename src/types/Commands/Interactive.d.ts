import type { AdvancedClient as Client } from '../Socket';
import type { MessageGenerated } from '../Messages';
import type { FileTypeResult } from 'file-type';

type MediaType = 'videoMessage' | 'imageMessage';
type Media = string | Buffer | undefined | null;
type Rows = { header: string; title: string; description: string; id: string };
type Sections = { title: string; highlight_label: string; rows: Rows[] };
type Cards = { body: string | null; footer: string | null; title: string | null } & Partial<{ header: string | Buffer }>;
type Buttons = {
	name:
		| 'cta_copy'
		| 'quick_reply'
		| 'cta_url'
		| 'single_select'
		| 'cta_call'
		| 'cta_reminder'
		| 'cta_cancel_reminder'
		| 'address_message'
		| 'send_location';
	buttonParamsJson: string;
};

declare class InteractiveButtons {
	button: {
		copy: ({ display: string, code: string }) => { name: 'cta_copy'; buttonParamsJson: string };
		reply: ({ display: string, id: string }) => { name: 'quick_reply'; buttonParamsJson: string };
		url: ({ display: string, url: string }) => { name: 'cta_url'; buttonParamsJson: string };
		list: ({ display: string, sections: Sections }) => { name: 'single_select'; buttonParamsJson: string };
		call: ({ display: string, id: string }) => { name: 'cta_call'; buttonParamsJson: string };
		reminder: ({ display: string, id: string }) => { name: 'cta_reminder'; buttonParamsJson: string };
		cancel: ({ display: string, id: string }) => { name: 'cta_cancel_reminder'; buttonParamsJson: string };
		address: ({ display: string, id: string }) => { name: 'address_message'; buttonParamsJson: string };
		location: () => { name: 'send_location'; buttonParamsJson: '' };
	};
}

declare class Carousel extends InteractiveButtons {
	client: Client;

	constructor(client: Client);

	render(): Promise<void>;

	mainBody(text: string): Carousel;

	mainFooter(text: string): Carousel;

	mainBody(text: string): Carousel;

	mainHeader(text: string, media: Media): Carousel;

	getMessageType(media: Buffer): { mime: FileTypeResult['mime']; messageType: MediaType };

	prepareGif(media: Buffer, messageType: MediaType): MessageGenerated;

	cards(cards: Cards): Carousel;
}

declare class Native extends InteractiveButtons {
	client: Client;

	constructor(client: Client);

	render(): Promise<void>;

	mainBody(text: string): Native;

	mainFooter(text: string): Native;

	mainBody(text: string): Native;

	mainHeader(text: string, media: Media): Native;

	getMessageType(media: Buffer): { mime: FileTypeResult['mime']; messageType: MediaType };

	prepareGif(media: Buffer, messageType: MediaType): MessageGenerated;

	buttons(...buttons: Buttons[]): Native;
}

export declare class TemplateBuilder {
	Carousel: typeof Carousel;
	Native: typeof Native;
}
