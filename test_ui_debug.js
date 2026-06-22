const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-web-security'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.goto('file:///home/pontsho/Workspace/projects/circuitjs1/site/circuit.test.html', {waitUntil: 'networkidle0'});
    await new Promise(r => setTimeout(r, 1000));
    
    const isReady = await page.evaluate(() => {
        return !!window.oncircuitjsloaded;
    });
    console.log('isReady defined:', isReady);

    const hasSim = await page.evaluate(() => {
        return document.getElementById('btn-reset').onclick !== null; // wait, event listener not onclick
    });

    await page.evaluate(() => {
        document.getElementById('btn-draw').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    
    const hasClass = await page.evaluate(() => {
        return document.getElementById('menu-draw').classList.contains('show');
    });
    console.log('Has class show after manual dispatch:', hasClass);

    await browser.close();
})();
