import puppeteer from 'puppeteer-extra';
import puppeteerSrealth from 'puppeteer-extra-plugin-stealth';
import fs from 'fs-extra';

const flag = process.argv.some((arg) => arg === '--get');

export const getCookie = async () => {
	puppeteer.use(puppeteerSrealth());

	const browser = await puppeteer.launch({ headless: false });

	await browser.newPage();
	const page = await browser.newPage();

	page.setDefaultTimeout(0);

	await page.goto('https://nhentai.net/');

	await page.setExtraHTTPHeaders({
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
	});

	await page.waitForSelector('div#content');

	let cookie = await page.cookies();

	await browser.close();

	cookie = cookie.map((v) => `${v.name}=${v.value}`).join('; ');
	fs.writeFileSync('./src/helper/config/nh_cookies.txt', cookie);

	return cookie;
};

if (flag) {
	await getCookie();
}
