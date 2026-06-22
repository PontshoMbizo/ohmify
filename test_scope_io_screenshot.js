const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-web-security'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // click on the first problem to go to the simulator
    await page.waitForSelector('a[href^="/problem/"]');
    await page.click('a[href^="/problem/"]');
    await page.waitForTimeout(3000); // wait for simulator to load
    
    await page.screenshot({ path: 'scope_io_sim.png' });
    await browser.close();
})();
