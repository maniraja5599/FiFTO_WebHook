import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { VERIFIED_PNL_URL } from './src/config.js';

async function scrape() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Listen for API responses
    const apiData = [];
    page.on('response', async response => {
        const url = response.url();
        // Flattrade API likely contains 'pnl' or similar in URL, or returns JSON
        if (response.headers()['content-type']?.includes('json')) {
            try {
                const json = await response.json();
                // Check if it looks like P&L data
                const str = JSON.stringify(json).toLowerCase();
                if (str.includes('pnl') || str.includes('realized') || str.includes('profit')) {
                    console.log(`Found potential data in ${url}`);
                    apiData.push({ url, data: json });
                }
            } catch (e) {
                // ignore
            }
        }
    });

    console.log(`Navigating to ${VERIFIED_PNL_URL}...`);
    await page.goto(VERIFIED_PNL_URL, { waitUntil: 'networkidle0', timeout: 60000 });

    console.log('Waiting for 10 seconds to ensure data loads...');
    await new Promise(r => setTimeout(r, 10000));

    console.log('Dumping page content...');
    const content = await page.content();
    await fs.writeFile('debug_page.html', content);

    console.log('Attempting to extract Vue component data...');
    console.log('Collecting all relevant Vue component data...');
    const allVueData = await page.evaluate(() => {
        const results = [];
        const visited = new Set();

        function scan(vm) {
            if (!vm || visited.has(vm)) return;
            visited.add(vm);

            try {
                const data = vm.$data;
                if (data) {
                    const str = JSON.stringify(data).toLowerCase();
                    // Look for data that seems to contain P&L info
                    // We check for 'pnl' and ensure it's not just config (check length or specific keys)
                    if (str.length > 200 && (str.includes('pnl') || str.includes('realised') || str.includes('profit'))) {
                        results.push({
                            tag: vm.$options?._componentTag || 'unknown',
                            data: data
                        });
                    }
                }
            } catch (e) { }

            if (vm.$children) {
                vm.$children.forEach(scan);
            }
        }

        const all = document.querySelectorAll('*');
        for (const el of all) {
            if (el.__vue__) {
                scan(el.__vue__);
            }
        }
        return results;
    });

    if (allVueData.length > 0) {
        console.log(`Found ${allVueData.length} Vue data objects.`);
        await fs.writeFile('debug_vue_data.json', JSON.stringify(allVueData, null, 2));

        // Try to find the best match (largest data)
        const bestMatch = allVueData.sort((a, b) => JSON.stringify(b.data).length - JSON.stringify(a.data).length)[0];
        if (bestMatch) {
            console.log(`Best match tag: ${bestMatch.tag}`);
            const rawDataPath = path.resolve('src/utils/pnlDataRaw.json');
            await fs.writeFile(rawDataPath, JSON.stringify(bestMatch.data, null, 2));
            console.log(`Saved best match to ${rawDataPath}`);

            // Process the data
            console.log('Processing data...');
            const raw = bestMatch.data;

            if (raw.values && Array.isArray(raw.values)) {
                const processed = raw.values.map(d => {
                    // Parse date "YYYY-MM-DD"
                    const [year, month, day] = d.date.split('-').map(Number);
                    const dateObj = new Date(year, month - 1, day);

                    return {
                        date: dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                        rawDate: d.date,
                        dailyPnL: d.value,
                        fnoPnL: d.dayFnoValue || 0,
                        equityPnL: d.dayEquityValue || 0,
                        commodityPnL: d.dayCommodityValue || 0,
                        currencyPnL: d.dayCurrncyValue || 0,
                        trades: 0, // Not available in daily summary
                        roi: ((d.value / 10000000) * 100).toFixed(2) // Assuming 1Cr capital
                    };
                });

                // Sort ascending
                processed.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

                // Calculate cumulative for All
                let cumulative = 0;
                processed.forEach(d => {
                    cumulative += d.dailyPnL;
                    d.cumulativePnL = cumulative;
                });

                const pnlDataPath = path.resolve('src/utils/pnlData.json');
                await fs.writeFile(pnlDataPath, JSON.stringify(processed, null, 2));
                console.log(`Saved processed data to ${pnlDataPath}`);

                // Also save trade-wise data with segments if available
                if (raw.pnlValue && Array.isArray(raw.pnlValue)) {
                    const tradesDataPath = path.resolve('src/utils/tradesData.json');
                    await fs.writeFile(tradesDataPath, JSON.stringify(raw.pnlValue, null, 2));
                    console.log(`Saved trades data to ${tradesDataPath}`);

                    const tradesJsContent = `import data from './tradesData.json';
export const tradesData = data;
`;
                    await fs.writeFile(path.resolve('src/utils/tradesData.js'), tradesJsContent);
                }

                // Update src/utils/pnlData.js
                const jsContent = `import data from './pnlData.json';
export const pnlData = data;
`;
                const jsPath = path.resolve('src/utils/pnlData.js');
                await fs.writeFile(jsPath, jsContent);
                console.log(`Updated ${jsPath}`);
            } else {
                console.log('Error: "values" array not found in the extracted data.');
            }
        }
    } else {
        console.log('No relevant Vue data found.');
    }

    await browser.close();
}

scrape().catch(console.error);
