import emoji from 'node-emoji';

import { isEmpty, isNotEmpty, isNotZero, isSame, isZero, randomize } from '../../helper/modules/index.js';

const randomFruitEmoji = () => {
	const emojis = [emoji.emojify(':apple:'), emoji.emojify(':grapes:'), emoji.emojify(':banana:'), emoji.emojify(':pineapple:'), emoji.emojify(':watermelon:')];

	return Array(9)
		.fill()
		.map(() => {
			return randomize(emojis);
		});
};

export const slot = (bet) => {
	bet = isEmpty(bet) ? 2 : bet;
	const arr = randomFruitEmoji();
	let prices = 0;
	const top = arr.slice(0, 3);
	const middle = arr.slice(3, 6);
	const bottom = arr.slice(6, 9);
	const topSame = isSame(top[0], top[1]) && isSame(top[0], top[2]) ? ' ◄' : '';
	const middleSame = isSame(middle[0], middle[1]) && isSame(middle[0], middle[2]) ? ' ◄' : '';
	const bottomSame = isSame(bottom[0], bottom[1]) && isSame(bottom[0], bottom[2]) ? ' ◄' : '';
	const firstColumnSame = isSame(top[0], middle[0]) && isSame(top[0], bottom[0]) ? ' ▲' : '';
	const secondColumnSame = isSame(top[1], middle[1]) && isSame(top[1], bottom[1]) ? ' ▲' : '';
	const thirdColumnSame = isSame(top[2], middle[2]) && isSame(top[2], bottom[2]) ? ' ▲' : '';
	const arrowCapt = [];
	const grid = [top.join(' ') + topSame, middle.join(' ') + middleSame, bottom.join(' ') + bottomSame].filter((v) => isNotEmpty(v)).join('\n');

	prices = [topSame, middleSame, bottomSame];

	if (!(isEmpty(firstColumnSame) && isEmpty(secondColumnSame) && isEmpty(thirdColumnSame))) {
		if (isNotEmpty(firstColumnSame) && isEmpty(secondColumnSame) && isEmpty(thirdColumnSame)) {
			prices.push(' ⥉') && arrowCapt.push(' ⥉');
		} else if (isNotEmpty(firstColumnSame) && isNotEmpty(secondColumnSame) && isEmpty(thirdColumnSame)) {
			prices.push(' ⥉   ', '   ⥉') && arrowCapt.push(' ⥉   ', '   ⥉');
		} else if (isNotEmpty(firstColumnSame) && isNotEmpty(secondColumnSame) && isNotEmpty(thirdColumnSame)) {
			prices.push(' ⥉   ', '  ⥉   ', '   ⥉') && arrowCapt.push(' ⥉   ', '  ⥉   ', '   ⥉');
		} else if (isNotEmpty(firstColumnSame) && isEmpty(secondColumnSame) && isNotEmpty(thirdColumnSame)) {
			prices.push(' ⥉      ', '       ⥉') && arrowCapt.push(' ⥉     ', '       ⥉');
		} else if (isEmpty(firstColumnSame) && isNotEmpty(secondColumnSame) && isEmpty(thirdColumnSame)) {
			prices.push('        ⥉ ') && arrowCapt.push('        ⥉ ');
		} else if (isEmpty(firstColumnSame) && isEmpty(secondColumnSame) && isNotEmpty(thirdColumnSame)) {
			prices.push('               ⥉') && arrowCapt.push('               ⥉');
		} else if (isEmpty(firstColumnSame) && isNotEmpty(secondColumnSame) && isNotEmpty(thirdColumnSame)) {
			prices.push('        ⥉ ', ' ⥉') && arrowCapt.push('        ⥉ ', ' ⥉');
		} else {
			prices.push('');
		}
	}

	prices = prices.filter((v) => isNotEmpty(v)).length * Number(bet);
	const result = {
		titleUp: '╭─🎰─╮\n',
		downDown: '╰─🎰─╯\n',
		grid: `${grid}${isNotZero(arrowCapt.length) ? `\n${arrowCapt.join(' ')}` : ''}`,
		stringify: `╭─🎰─╮\n${grid + (isNotZero(arrowCapt.length) ? `\n${arrowCapt.join(' ')}` : '')}\n╰─🎰─╯`,
	};

	if (isZero(prices)) {
		result.lose = bet;
	} else {
		result.win = prices;
	}

	return result;
};
