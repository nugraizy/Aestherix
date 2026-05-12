export const processSettingsStubtype = async (update) => {
	const {
		attrs: { from: id, participant: author },
		content: [{ tag, attrs }]
	} = update;

	if (tag === 'ephemeral' || tag === 'not_ephemeral') {
		const update = { id, author, ephemeral: attrs.expiration || 0 };

		client.ev.emit('groups.update', [update]);
	}
};
