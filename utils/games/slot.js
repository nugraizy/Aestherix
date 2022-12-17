import emoji from 'node-emoji';

import { randomize } from '../../helper/modules/index.js';

const randomFruitEmoji = () => {
	const emojis = [
		emoji.emojify(':apple:'),
		emoji.emojify(':grapes:'),
		emoji.emojify(':banana:'),
		emoji.emojify(':pineapple:'),
		emoji.emojify(':watermelon:'),
	];

	return Array(9)
		.fill()
		.map(() => randomize(emojis));
};

export const slot = (bet) => {
	bet = bet === '' ? 2 : bet;
	const arr = randomFruitEmoji();
	let prices = 0;
	const top = arr.slice(0, 3);
	const middle = arr.slice(3, 6);
	const bottom = arr.slice(6, 9);
	const topSame = top[0] === top[1] && top[0] === top[2] ? ' ◄' : '';
	const middleSame = middle[0] === middle[1] && middle[0] === middle[2] ? ' ◄' : '';
	const bottomSame = bottom[0] === bottom[1] && bottom[0] === bottom[2] ? ' ◄' : '';
	const firstColumnSame = top[0] === middle[0] && top[0] === bottom[0] ? ' ▲' : '';
	const secondColumnSame = top[1] === middle[1] && top[1] === bottom[1] ? ' ▲' : '';
	const thirdColumnSame = top[2] === middle[2] && top[2] === bottom[2] ? ' ▲' : '';
	const arrowCapt = [];
	const grid = [top.join(' ') + topSame, middle.join(' ') + middleSame, bottom.join(' ') + bottomSame]
		.filter((v) => v !== '')
		.join('\n');

	prices = [topSame, middleSame, bottomSame];

	if (!(firstColumnSame === '' && secondColumnSame === '' && thirdColumnSame === '')) {
		if (firstColumnSame !== '' && secondColumnSame === '' && thirdColumnSame === '') {
			prices.push(' ⥉') && arrowCapt.push(' ⥉');
		} else if (firstColumnSame !== '' && secondColumnSame !== '' && thirdColumnSame === '') {
			prices.push(' ⥉   ', '   ⥉') && arrowCapt.push(' ⥉   ', '   ⥉');
		} else if (firstColumnSame !== '' && secondColumnSame !== '' && thirdColumnSame !== '') {
			prices.push(' ⥉   ', '  ⥉   ', '   ⥉') && arrowCapt.push(' ⥉   ', '  ⥉   ', '   ⥉');
		} else if (firstColumnSame !== '' && secondColumnSame === '' && thirdColumnSame !== '') {
			prices.push(' ⥉      ', '       ⥉') && arrowCapt.push(' ⥉     ', '       ⥉');
		} else if (firstColumnSame === '' && secondColumnSame !== '' && thirdColumnSame === '') {
			prices.push('        ⥉ ') && arrowCapt.push('        ⥉ ');
		} else if (firstColumnSame === '' && secondColumnSame === '' && thirdColumnSame !== '') {
			prices.push('               ⥉') && arrowCapt.push('               ⥉');
		} else if (firstColumnSame === '' && secondColumnSame !== '' && thirdColumnSame !== '') {
			prices.push('        ⥉ ', ' ⥉') && arrowCapt.push('        ⥉ ', ' ⥉');
		} else {
			prices.push('');
		}
	}

	prices = prices.filter((v) => v !== '').length * Number(bet);
	const result = {
		titleUp: '╭─🎰─╮\n',
		downDown: '╰─🎰─╯\n',
		grid: `${grid}${arrowCapt.length !== 0 ? `\n${arrowCapt.join(' ')}` : ''}`,
		stringify: `╭─🎰─╮\n${grid + (arrowCapt.length !== 0 ? `\n${arrowCapt.join(' ')}` : '')}\n╰─🎰─╯`,
	};

	if (prices === 0) {
		result.lose = bet;
	} else {
		result.win = prices;
	}

	return result;
};
