import puppeteer from 'puppeteer';

const url = process.argv[2] || 'https://2captcha.com/demo/cloudflare-turnstile-challenge';

const browser = await puppeteer.launch({
	headless: false,
	defaultViewport: null,
	args: ['--disable-gpu', '--disable-blink-features=AutomationControlled', '--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });

console.log('Manual test running. Solve in the opened browser window.');
console.log('Press Ctrl+C to exit.');

const shutdown = async () => {
	try {
		await page.close();
	} catch {}
	try {
		await browser.close();
	} catch {}
	process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
