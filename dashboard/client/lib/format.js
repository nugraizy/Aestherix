export function stripAnsi(text) {
	return String(text || '')
		.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g, '');
}

export function formatTrackTime(ms) {
	if (!ms || ms < 0) {
		return '0:00';
	}

	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatLogTime(value) {
	if (!value) {
		return '';
	}

	const ts = Number(value) || Date.parse(value);

	if (!Number.isFinite(ts)) {
		return String(value);
	}

	return new Date(ts).toLocaleTimeString();
}

export function formatRelativeTime(timestamp) {
	if (!timestamp) {
		return '';
	}

	const ts = Number(timestamp) || Date.parse(timestamp);

	if (!Number.isFinite(ts)) {
		return '';
	}

	const diff = Date.now() - ts;
	const seconds = Math.floor(diff / 1000);

	if (seconds < 5) {
		return 'just now';
	}

	if (seconds < 60) {
		return `${seconds}s ago`;
	}

	const minutes = Math.floor(seconds / 60);

	if (minutes < 60) {
		return `${minutes}m ago`;
	}

	const hours = Math.floor(minutes / 60);

	if (hours < 24) {
		return `${hours}h ago`;
	}

	const days = Math.floor(hours / 24);

	return `${days}d ago`;
}

export function formatNumber(value, decimals = 0) {
	if (value === null || value === undefined) {
		return '—';
	}

	return Number(value).toLocaleString(undefined, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	});
}

export function formatBytes(bytes) {
	if (!bytes) {
		return '0 B';
	}

	const units = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));

	return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
