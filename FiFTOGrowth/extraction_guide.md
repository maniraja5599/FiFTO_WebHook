# Verified P&L Extraction Guide

This document explains the technical method used to extract verified daily P&L data from the Flattrade Verified P&L URL (`https://wall.flattrade.in/pnl/PO48d06e2272034b9e85d476c7fbd58057`).

## Overview

The extraction is performed by a Node.js script (`fetch_pnl.js`) that uses **Puppeteer** (a headless Chrome browser) to load the page and extract data directly from the application's internal memory (Vue.js state). This method is superior to traditional HTML scraping because it retrieves the raw, exact numbers used by the chart, avoiding parsing errors or rounding issues.

## Technical Steps

### 1. Browser Automation (Puppeteer)
-   The script launches a headless Chrome browser.
-   It navigates to the target URL and waits for the network to be idle and for the page to fully render (waiting an additional 10 seconds to ensure all asynchronous data is loaded).

### 2. Vue.js Component Data Extraction
The Flattrade P&L page is built using **Vue.js**. Instead of trying to parse the HTML table (which may be paginated or dynamically generated), we access the data directly from the Vue component instances.

-   **Traversal**: The script executes code within the browser context (`page.evaluate`) to find all DOM elements.
-   **Vue Instance Access**: It checks for the `__vue__` property on DOM elements, which exposes the Vue component instance.
-   **Recursive Scan**: It recursively scans the component tree (`$children`) to find all data objects (`$data`).
-   **Filtering**: It filters these data objects to find the one containing P&L information. It looks for objects that:
    -   Are larger than a certain size (to avoid empty configs).
    -   Contain keywords like "pnl", "realised", or "profit".

### 3. Identifying the Correct Data
-   The script collects all matching Vue data objects.
-   It identifies the "best match" by selecting the largest data object found. In this case, it successfully identifies the `PandLDetails` component data.
-   This data object contains a `values` array, which holds the daily P&L figures.

### 4. Data Processing
Once the raw JSON data is extracted, the script processes it locally:
-   **Date Parsing**: Converts the date string (e.g., "2025-01-17") into a readable format.
-   **Sorting**: Sorts the entries chronologically.
-   **ROI Calculation**: Calculates the Return on Investment (ROI) for each day based on a fixed capital (e.g., ₹1 Crore).
    -   Formula: `(Daily P&L / 1,00,00,000) * 100`
-   **Cumulative P&L**: Iterates through the sorted days to calculate the running total (cumulative P&L).

### 5. File Generation
-   **`src/utils/pnlData.json`**: The processed data is saved as a JSON file.
-   **`src/utils/pnlData.js`**: This file is updated to import the new JSON file and export it for use by the React application.

## How to Run the Extraction

To update the data with the latest P&L, simply run the following command in your terminal:

```bash
node fetch_pnl.js
```

This will:
1.  Launch the scraper.
2.  Fetch the latest data.
3.  Overwrite `src/utils/pnlData.json`.
4.  The running application (if using `npm run dev`) will automatically reload with the new data.



Here is fetch_pnl.js file
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const URL = 'https://wall.flattrade.in/pnl/PO48d06e2272034b9e85d476c7fbd58057';

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

    console.log(`Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });

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
                        trades: 0, // Not available in daily summary
                        roi: ((d.value / 10000000) * 100).toFixed(2) // Assuming 1Cr capital
                    };
                });

                // Sort ascending
                processed.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

                // Calculate cumulative
                let cumulative = 0;
                processed.forEach(d => {
                    cumulative += d.dailyPnL;
                    d.cumulativePnL = cumulative;
                });

                const pnlDataPath = path.resolve('src/utils/pnlData.json');
                await fs.writeFile(pnlDataPath, JSON.stringify(processed, null, 2));
                console.log(`Saved processed data to ${pnlDataPath}`);

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
