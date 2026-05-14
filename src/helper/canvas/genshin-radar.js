import { createCanvas } from '@napi-rs/canvas';

const RADAR_LABELS = ['Max HP', 'ATK', 'DEF', 'Elemental Mastery', 'CRIT Rate', 'CRIT DMG', 'Energy Recharge'];
const RADAR_KEYS = ['maxHealth', 'attack', 'defense', 'elementMastery', 'critRate', 'critDamage', 'chargeEfficiency'];
const RADAR_MAX = [35000, 2500, 2000, 800, 0.75, 2.5, 2.5];

export function renderRadarChart(statMap, fillColor) {
	const size = 300;
	const cx = size / 2;
	const cy = size / 2;
	const radius = 110;
	const sides = RADAR_KEYS.length;
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

	const values = RADAR_KEYS.map((key, i) => {
		const stat = statMap[key];

		if (!stat) {
			return 0;
		}

		const raw = stat.rawValue ?? 0;

		return Math.min(raw / RADAR_MAX[i], 1);
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

		const words = RADAR_LABELS[i].split(' ');

		ctx.font = 'bold 11px sans-serif';
		ctx.fillStyle = '#ffffff';

		if (words.length > 1) {
			ctx.fillText(words[0], lx, ly - 6);
			ctx.fillText(words.slice(1).join(' '), lx, ly + 6);
		} else {
			ctx.fillText(RADAR_LABELS[i], lx, ly);
		}

		const stat = statMap[RADAR_KEYS[i]];

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
