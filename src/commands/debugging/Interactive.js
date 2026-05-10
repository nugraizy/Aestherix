import { getWaifu } from '../../utils/index.js';
import { cmdId } from '../../helper/modules/prefix.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'interactive',
	description: 'Send interactive.',
	category: 'Debugging',
	usage: '!interactive',
	aliases: ['inter'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from }, client) {
		const carousel = async () => {
			const waifu = (await getWaifu('waifu', 'sfw'))[0];
			const builder = new client.instance.TemplateBuilder.Carousel();

			await builder
				.destination(from)
				.body('Body')
				.footer('Footer')
				.header('Header', waifu)
				.cards([
					{
						body: 'Body Cards',
						footer: 'Footer Cards',
						title: 'Title Cards',
						header: Buffer.alloc(10),
						buttons: [
							builder.button.reply({
								display: 'Open Menu!',
								id: cmdId('menu')
							})
						]
					},
					{
						body: 'Body Cards',
						footer: 'Footer Cards',
						title: 'Title Cards',
						header: Buffer.alloc(10),
						buttons: [
							builder.button.url({
								display: 'GitHub User!',
								url: 'https://github.com/nugraizy'
							})
						]
					},
					{
						body: 'Body Cards',
						footer: 'Footer Cards',
						title: 'Title Cards',
						header: Buffer.alloc(10),
						buttons: [
							builder.button.copy({
								code: '123-456',
								display: 'Copy Code!'
							})
						]
					},
					{
						body: 'Body Cards',
						footer: 'Footer Cards',
						title: 'Title Cards',
						header: Buffer.alloc(10),
						buttons: [
							builder.button.reminder({
								display: 'Send Reminder',
								id: 'reminder'
							})
						]
					},
					{
						body: 'Body Cards',
						footer: 'Footer Cards',
						title: 'Title Cards',
						header: Buffer.alloc(10),
						buttons: [builder.button.location({ display: 'Hello World' })]
					},
					{
						body: 'Body Cards',
						footer: 'Footer Cards',
						title: 'Title Cards',
						header: Buffer.alloc(10),
						buttons: [
							builder.button.address({
								display: 'Send Address',
								id: 'address'
							})
						]
					},
					{
						body: 'Body Cards',
						footer: 'Footer Cards',
						title: 'Title Cards',
						header: Buffer.alloc(10),
						buttons: [
							builder.button.list({
								display: 'Open Lists!',
								sections: [
									{
										highlight_label: 'Favorites',
										title: 'Menu',
										rows: [
											{
												description: '',
												header: 'Show all the menu from this bot!',
												id: cmdId('menu'),
												title: 'Menu'
											}
										]
									},
									{
										title: 'Menu',
										rows: [
											{
												description: '',
												header: 'Show latency!',
												id: cmdId('ping'),
												title: 'Ping'
											}
										]
									}
								]
							})
						]
					}
				])
				.send();
		};

		const native = async () => {
			const waifu = (await getWaifu('waifu', 'sfw'))[0];
			const builder = new client.instance.TemplateBuilder.Native();

			await builder
				.destination(from)
				.body('Body')
				.footer('Footer')
				.header('Header', waifu)
				.buttons(
					builder.button.reply({
						display: 'Open Menu!',
						id: cmdId('menu')
					}),
					builder.button.url({
						display: 'GitHub User!',
						url: 'https://github.com/nugraizy'
					}),
					builder.button.copy({
						code: '123-456',
						display: 'Copy Code!'
					})
				)
				.send();
		};

		await carousel();
		await native();
	}
};
