const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-web-security'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    // Server must be running for iframe loading, but we can just use file:// protocol.
    await page.goto('file:///home/pontsho/Workspace/projects/circuitjs1/site/circuit.test.html', {waitUntil: 'networkidle0'});
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if triggerMenu exists
    const hasTriggerMenu = await page.evaluate(() => {
        const iframe = document.getElementById('simFrame');
        if(!iframe || !iframe.contentWindow || !iframe.contentWindow.CircuitJS1) return false;
        return typeof iframe.contentWindow.CircuitJS1.triggerMenu === 'function';
    });
    console.log('Has triggerMenu:', hasTriggerMenu);
    
    await browser.close();
})();
