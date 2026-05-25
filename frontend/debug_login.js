const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`PAGE LOG: ${msg.type()} - ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.type('#login-email', 'ceo@security.com');
  await page.type('#login-password', 'ceo123');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
