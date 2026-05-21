export function stripAnsi(text) {
	return String(text || '')
		.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g, '');
}

const ANSI_COLORS = {
	30: '#4b5563', 31: '#ff5555', 32: '#50fa7b', 33: '#f1fa8c',
	34: '#bd93f9', 35: '#ff79c6', 36: '#8be9fd', 37: '#f8f8f2',
	90: '#6272a4', 91: '#ff6e6e', 92: '#69ff94', 93: '#ffffa5',
	94: '#d6acff', 95: '#ff92df', 96: '#a4ffff', 97: '#ffffff'
};

export function ansiToHtml(text) {
	const str = String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	let result = '';
	let open = false;
	let i = 0;

	while (i < str.length) {
		if (str[i] === '\x1b' || str[i] === '\u001b') {
			const match = str.slice(i).match(/^\x1b\[([0-9;]*)m/);

			if (match) {
				i += match[0].length;
				const codes = match[1].split(';').map(Number);

				if (codes.includes(0) || match[1] === '') {
					if (open) {
						result += '</span>';
						open = false;
					}
				} else {
					if (open) {
						result += '</span>';
					}

					let color = '';
					let bold = false;

					for (const code of codes) {
						if (code === 1) {
							bold = true;
						} else if (ANSI_COLORS[code]) {
							color = ANSI_COLORS[code];
						} else if (code === 38) {
							const rgb = extractRgb(codes);

							if (rgb) {
								color = rgb;
							}

							break;
						}
					}

					if (color) {
						result += `<span style="color:${color}${bold ? ';font-weight:700' : ''}">`;
						open = true;
					} else if (bold) {
						result += '<span style="font-weight:700">';
						open = true;
					}
				}

				continue;
			}
		}

		result += str[i];
		i++;
	}

	if (open) {
		result += '</span>';
	}

	return result;
}

function extractRgb(codes) {
	const idx = codes.indexOf(38);

	if (idx < 0) {
		return null;
	}

	if (codes[idx + 1] === 2 && codes.length >= idx + 5) {
		return `rgb(${codes[idx + 2]},${codes[idx + 3]},${codes[idx + 4]})`;
	}

	return null;
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
