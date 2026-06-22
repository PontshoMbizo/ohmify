const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-web-security'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('file:///home/pontsho/Workspace/projects/circuitjs1/site/circuit.test.html', {waitUntil: 'networkidle0'});
    await new Promise(r => setTimeout(r, 1000));
    
    // Check state before
    const state1 = await page.evaluate(() => {
        const iframe = document.getElementById('simFrame');
        return typeof iframe.contentWindow.CircuitJS1.triggerMenu;
    });
    console.log('type:', state1);
    
    // Test triggerMenu directly
    await page.evaluate(() => {
        const iframe = document.getElementById('simFrame');
        try {
            iframe.contentWindow.CircuitJS1.triggerMenu('main', 'ResistorElm');
            console.log('triggerMenu completed without exceptions');
        } catch(e) {
            console.log('Error triggering menu:', e.message);
        }
    });

    await browser.close();
})();
