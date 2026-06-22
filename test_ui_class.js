const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-web-security'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.goto('file:///home/pontsho/Workspace/projects/circuitjs1/site/circuit.test.html', {waitUntil: 'networkidle0'});
    await new Promise(r => setTimeout(r, 1000));
    
    // Check if toggleMenu ran
    await page.evaluate(() => {
        document.getElementById('btn-draw').click();
    });
    
    const hasClass = await page.evaluate(() => {
        return document.getElementById('menu-draw').classList.contains('show');
    });
    console.log('Has class show:', hasClass);

    await browser.close();
})();
