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
		// const image = await client.instance.prepareMedia(Buffer.alloc(10), 'imageMessage');

		const carousel = async () => {
			const builder = new client.instance.TemplateBuilder.Carousel(client);

			builder
				.mainBody('Body')
				.mainFooter('Footer')
				.mainHeader('Header')
				.cards([
					{
						body: 'Body Cards',
						footer: 'Footer Cards',
						title: 'Title Cards',
						header: Buffer.alloc(10),
						buttons: [
							builder.button.reply({
								display: 'Open Menu!',
								id: '.menu'
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
												id: '.menu',
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
												id: '.ping',
												title: 'Ping'
											}
										]
									}
								]
							})
						]
					}
				]);

			const messageBuilt = await builder.render();

			await client.instance.relay(from, messageBuilt.message, { messageId: messageBuilt.key.id });
		};

		const native = async () => {
			const builder = new client.instance.TemplateBuilder.Native(client);

			builder
				.mainBody('Body')
				.mainFooter('Footer')
				.mainHeader('Header')
				.buttons(
					builder.button.reply({
						display: 'Open Menu!',
						id: '.menu'
					}),
					builder.button.url({
						display: 'GitHub User!',
						url: 'https://github.com/nugraizy'
					}),
					builder.button.copy({
						code: '123-456',
						display: 'Copy Code!'
					}),
					builder.button.reminder({
						display: 'Send Reminder',
						id: 'reminder'
					}),
					builder.button.location(),
					builder.button.address({
						display: 'Send Address',
						id: 'address'
					}),
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
										id: '.menu',
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
										id: '.ping',
										title: 'Ping'
									}
								]
							}
						]
					})
				);

			const messageBuilt = await builder.render();

			await client.instance.relay(from, messageBuilt.message, { messageId: messageBuilt.key.id });
		};

		await carousel();
		await native();
	}
};
