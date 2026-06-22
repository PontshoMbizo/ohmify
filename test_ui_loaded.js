const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-web-security'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.goto('file:///home/pontsho/Workspace/projects/circuitjs1/site/circuit.test.html', {waitUntil: 'networkidle0'});
    await new Promise(r => setTimeout(r, 1000));
    
    // Check if the event ran
    const didRun = await page.evaluate(() => {
        return !!document.querySelector('.dropdown-item').onclick;
    });
    console.log('didRun:', didRun);

    const hasListener = await page.evaluate(() => {
        return !!window.simLoaded; // I didn't set a global variable
    });
    console.log('hasListener:', hasListener);
    
    await browser.close();
})();
