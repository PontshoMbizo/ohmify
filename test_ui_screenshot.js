const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-web-security'] });
    const page = await browser.newPage();
    await page.setViewport({width: 1200, height: 800});
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.goto('file:///home/pontsho/Workspace/projects/circuitjs1/site/circuit.test.html', {waitUntil: 'networkidle0'});
    await new Promise(r => setTimeout(r, 1000));
    
    // Take a screenshot
    await page.screenshot({path: 'circuit_ui_before.png'});

    // Click Draw
    await page.click('#btn-draw');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({path: 'circuit_ui_draw_menu.png'});
    
    // Click Resistor
    await page.evaluate(() => {
        const items = document.querySelectorAll('.dropdown-item');
        for (let item of items) {
            if (item.innerText.includes('Resistor')) {
                item.click();
            }
        }
    });
    
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({path: 'circuit_ui_after_resistor.png'});

    await browser.close();
})();
