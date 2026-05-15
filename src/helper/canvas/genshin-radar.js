import { createCanvas } from '@napi-rs/canvas';

const DEFAULT_STATS = [
	{ key: 'maxHealth', label: 'Max HP', max: 35000 },
	{ key: 'attack', label: 'ATK', max: 2500 },
	{ key: 'defense', label: 'DEF', max: 2000 },
	{ key: 'elementMastery', label: 'Elemental Mastery', max: 800 },
	{ key: 'critRate', label: 'CRIT Rate', max: 0.75 },
	{ key: 'critDamage', label: 'CRIT DMG', max: 2.5 },
	{ key: 'chargeEfficiency', label: 'Energy Recharge', max: 2.5 },
	{ key: 'matchedElementDamage', label: 'DMG Bonus', max: 1.5 }
];

function resolveStats(statMap, overrides) {
	if (overrides?.length) {
		return overrides;
	}

	return DEFAULT_STATS.filter((s) => {
		const stat = statMap[s.key];

		return stat && stat.rawValue > 0;
	});
}

export function renderRadarChart(statMap, fillColor, statOverrides) {
	const stats = resolveStats(statMap, statOverrides);
	const sides = stats.length;

	if (sides < 3) {
		return null;
	}

	const size = 300;
	const cx = size / 2;
	const cy = size / 2;
	const radius = 110;
	const angleStep = (Math.PI * 2) / sides;
	const startAngle = -Math.PI / 2;

	const canvas = createCanvas(size, size);
	const ctx = canvas.getContext('2d');

	for (let ring = 4; ring >= 1; ring--) {
		const r = radius * (ring / 4);

		ctx.beginPath();

		for (let i = 0; i < sides; i++) {
			const angle = startAngle + i * angleStep;
			const x = cx + r * Math.cos(angle);
			const y = cy + r * Math.sin(angle);

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}

		ctx.closePath();
		ctx.strokeStyle = 'rgba(255,255,255,0.15)';
		ctx.lineWidth = 1;
		ctx.stroke();
	}

	for (let i = 0; i < sides; i++) {
		const angle = startAngle + i * angleStep;

		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
		ctx.strokeStyle = 'rgba(255,255,255,0.1)';
		ctx.lineWidth = 1;
		ctx.stroke();
	}

	const values = stats.map((s) => {
		const stat = statMap[s.key];

		if (!stat) {
			return 0;
		}

		const raw = stat.rawValue ?? 0;

		return Math.min(raw / s.max, 1);
	});

	ctx.beginPath();

	for (let i = 0; i < sides; i++) {
		const angle = startAngle + i * angleStep;
		const r = radius * values[i];
		const x = cx + r * Math.cos(angle);
		const y = cy + r * Math.sin(angle);

		if (i === 0) {
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
		}
	}

	ctx.closePath();
	ctx.fillStyle = fillColor.replace('rgb(', 'rgba(').replace(')', ',0.35)');
	ctx.fill();
	ctx.strokeStyle = fillColor;
	ctx.lineWidth = 2;
	ctx.stroke();

	for (let i = 0; i < sides; i++) {
		const angle = startAngle + i * angleStep;
		const r = radius * values[i];
		const x = cx + r * Math.cos(angle);
		const y = cy + r * Math.sin(angle);

		ctx.beginPath();
		ctx.arc(x, y, 3, 0, Math.PI * 2);
		ctx.fillStyle = fillColor;
		ctx.fill();
	}

	ctx.font = 'bold 11px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	for (let i = 0; i < sides; i++) {
		const angle = startAngle + i * angleStep;
		const lx = cx + (radius + 30) * Math.cos(angle);
		const ly = cy + (radius + 30) * Math.sin(angle);

		const words = stats[i].label.split(' ');

		ctx.font = 'bold 11px sans-serif';
		ctx.fillStyle = '#ffffff';

		if (words.length > 1) {
			ctx.fillText(words[0], lx, ly - 6);
			ctx.fillText(words.slice(1).join(' '), lx, ly + 6);
		} else {
			ctx.fillText(stats[i].label, lx, ly);
		}

		const stat = statMap[stats[i].key];

		if (stat) {
			const r = radius * values[i];
			const px = cx + r * Math.cos(angle);
			const py = cy + r * Math.sin(angle);

			ctx.font = '10px sans-serif';
			ctx.fillStyle = 'rgba(255,255,255,0.8)';
			ctx.fillText(stat.value, px, py + 12);
		}
	}

	return `data:image/png;base64,${canvas.toBuffer('image/png').toString('base64')}`;
}
