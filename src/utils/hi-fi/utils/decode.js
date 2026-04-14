export const decodeManifestBase64 = (base64) => {
	if (typeof base64 !== 'string') {
		return '';
	}

	const trimmed = base64.trim();

	if (!trimmed) {
		return '';
	}

	try {
		let normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');

		const padding = normalized.length % 4;

		if (padding === 2) {
			normalized += '==';
		}

		if (padding === 3) {
			normalized += '=';
		}

		return atob(normalized) || trimmed;
	} catch {
		return trimmed;
	}
};
