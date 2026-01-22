const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const MAP_FILE = '/tmp/brave-manager-map.json';

async function run() {
  const args = process.argv.slice(2);
  const command = args[0];
  const target = args[1];

  if (!command) {
    console.log('Usage: brave-manager <command> [args]');
    process.exit(1);
  }

  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
  }).catch(async () => {
    return await puppeteer.launch({
      executablePath: BRAVE_PATH,
      headless: false,
      defaultViewport: null,
      args: ['--remote-debugging-port=9222', '--user-data-dir=/tmp/brave-manager-profile', '--window-size=1440,900']
    });
  });

  const pages = await browser.pages();
  let page = pages[0];
  await page.setViewport({ width: 1440, height: 900 });

  try {
    if (command === 'tabs') {
      pages.forEach((p, i) => console.log(`[${i}] ${p.url()}`));
    } else if (command === 'switch') {
      const index = parseInt(target);
      page = pages[index] || pages[0];
      await page.bringToFront();
      console.log(`Switched to tab ${index}`);
    } else if (command === 'navigate') {
      await page.goto(target, { waitUntil: 'networkidle2' });
      console.log(`Navigated to ${target}`);
    } else if (command === 'inspect') {
      const elements = await page.evaluate(() => {
        document.querySelectorAll('.brave-manager-label').forEach(el => el.remove());
        const interactives = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], summary'));
        return interactives.map((el, i) => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none') return null;
          el.setAttribute('data-brave-id', i);
          const label = document.createElement('div');
          label.className = 'brave-manager-label';
          label.innerText = i;
          Object.assign(label.style, {
            position: 'absolute',
            top: (rect.top + window.scrollY) + 'px',
            left: (rect.left + window.scrollX) + 'px',
            background: 'red',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '2px 4px',
            borderRadius: '4px',
            zIndex: '9999999',
            pointerEvents: 'none',
            border: '1px solid white'
          });
          document.body.appendChild(label);
          return { id: i, tag: el.tagName.toLowerCase(), text: el.innerText?.trim().substring(0, 40) || el.placeholder || el.getAttribute('aria-label') || el.value || undefined };
        }).filter(Boolean);
      });
      fs.writeFileSync(MAP_FILE, JSON.stringify(elements));
      console.log('--- INTERACTIVE ELEMENTS ---');
      console.log(JSON.stringify(elements, null, 2));
    } else if (command === 'click' || command === 'type') {
      let selector = target;
      if (!isNaN(target)) selector = '[data-brave-id="' + target + '"]';
      if (command === 'click') {
        await page.click(selector);
        console.log('Clicked element ' + target);
      } else {
        await page.type(selector, args[2]);
        console.log('Typed into element ' + target);
      }
    } else if (command === 'eval') {
      const result = await page.evaluate(target);
      console.log(JSON.stringify(result, null, 2));
    } else if (command === 'errors') {
      const logs = await page.evaluate(() => window.performance.getEntriesByType('resource')
        .filter(r => r.responseStatus >= 400)
        .map(r => r.responseStatus + ' ' + r.name)
      );
      console.log('--- LAST ERRORS ---');
      console.log(logs.slice(-5).join('\n') || 'No errors found');
    } else if (command === 'screenshot') {
      await page.screenshot({ path: 'screenshot.png' });
      console.log('Screenshot saved');
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await browser.disconnect().catch(() => browser.close());
  }
}

run();
