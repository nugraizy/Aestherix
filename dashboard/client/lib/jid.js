const SUFFIX = '@s.whatsapp.net';

export function maskJid(value) {
	const safe = String(value || '').trim();

	if (!safe) {
		return '';
	}

	const [localRaw, domainRaw] = safe.split('@');
	const local = String(localRaw || '');
	const domain = domainRaw ? `@${domainRaw}` : SUFFIX;

	if (!local) {
		return domain;
	}

	if (local.length <= 6) {
		return `${local}${domain}`;
	}

	const prefix = local.slice(0, 4);
	const suffix = local.slice(-3);
	const middle = '*'.repeat(Math.max(1, local.length - 7));

	return `${prefix}${middle}${suffix}${domain}`;
}

export function unmaskedAvailable(value) {
	const safe = String(value || '');

	return safe.includes('*') === false && safe.length > 0;
}
