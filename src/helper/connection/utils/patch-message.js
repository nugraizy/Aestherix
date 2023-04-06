export const patchInteractiveMessage = (message) => {
	if (message.buttonsMessage || message.templateMessage || message.listMessage) {
		message = {
			viewOnceMessage: {
				message: {
					messageContextInfo: {
						deviceListMetadataVersion: 2,
						deviceListMetadata: {}
					},
					...message
				}
			}
		};
	}

	return message;
};
