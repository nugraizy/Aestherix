import boxen from 'boxen';
import chalk from 'chalk';
import fs from 'fs-extra';
import gradient from 'gradient-string';
import _ from 'lodash';

export const color = (...obj) => {
	if (obj.length % 2 !== 0) {
		log('Invalid Number of arguments. Please pairs of text and color.', obj);
		return;
	}

	let str = '';

	for (let i = 0; i < obj.length; i += 2) {
		const text = obj[i];
		const color = obj[i + 1];

		str +=
			typeof color === 'object'
				? gradient(color)(text)
				: typeof color === 'string'
					? chalk[color]?.(text) || chalk.hex(color)(text)
					: (() => {
							const schemes = _.sample(['teen', 'passion', 'instagram']);

							return gradient[schemes](text);
						})(); // eslint-disable-line
	}

	return str;
};

const ICON = color('ᛟ', '#E4C1F9');
const BANNER_ICON_1 = color('❝', '#FF5555');
const BANNER_ICON_2 = color('❞', '#FF5555');
const { version } = await fs.readJSON('./package.json');
const SPLITTER = ['᠁✦', '✦', '✦', '✦᠁'];
const AUTHOR = color('nugraizy', '#FF5555');

export const printBanner = () =>
	log(
		boxen(
			`${BANNER_ICON_1}${chalk.italic.bold.hex('#BD93F9')(__botName)}${BANNER_ICON_2}
version
${SPLITTER[0]} ${version.split(/\./g).join(` ${SPLITTER[1]} `)} ${SPLITTER[SPLITTER.length - 1]}`,
			{
				title: `${ICON} Made by @${AUTHOR} ${ICON}`,
				textAlignment: 'center',
				float: 'left',
				borderColor: 'gray',
				margin: 1,
				borderStyle: 'round'
			}
		)
	);
