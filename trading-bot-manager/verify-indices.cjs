const fs = require('fs');
const path = require('path');

const instrumentsPath = path.join(__dirname, 'public/data/instruments.json');

function verifyIndices() {
    if (!fs.existsSync(instrumentsPath)) {
        console.error('instruments.json not found!');
        return;
    }

    const data = JSON.parse(fs.readFileSync(instrumentsPath, 'utf8'));
    console.log(`Total instruments: ${data.length}\n`);

    const indicesToTest = [
        { label: 'NIFTY', search: 'NIFTY', exch: 'NFO' },
        { label: 'BANKNIFTY', search: 'BANKNIFTY', exch: 'NFO' },
        { label: 'FINNIFTY', search: 'FINNIFTY', exch: 'NFO' },
        { label: 'MIDCAP', search: 'MIDCPNIFTY', exch: 'NFO' },
        { label: 'SENSEX', search: 'SENSEX', exch: 'BFO' },
        { label: 'BANKEX', search: 'BANKEX', exch: 'BFO' }
    ];

    indicesToTest.forEach(index => {
        console.log(`Checking ${index.label} (mapping to ${index.search}, exchange ${index.exch})...`);
        const matches = data.filter(i =>
            i.name === index.search &&
            i.exch_seg === index.exch &&
            (i.instrumenttype === 'FUTIDX' || i.instrumenttype === 'OPTIDX')
        );

        if (matches.length > 0) {
            // Sort by expiry
            const sorted = matches.filter(i => i.instrumenttype === 'FUTIDX').sort((a, b) => {
                const parseDate = (d) => {
                    if (!d || d.length !== 9) return 0;
                    const day = d.substring(0, 2);
                    const month = d.substring(2, 5);
                    const year = d.substring(5);
                    return new Date(`${day} ${month} ${year}`).getTime() || 0;
                };
                return parseDate(a.expiry) - parseDate(b.expiry);
            });

            const nearest = sorted[0] || matches[0];
            console.log(` ✅ Found ${matches.length} contracts.`);
            console.log(`    Nearest: ${nearest.symbol} | Expiry: ${nearest.expiry} | Lot Size: ${nearest.lotsize}`);
            console.log(`    Quantity for 1 lot: ${nearest.lotsize}`);
            console.log(`    Quantity for 5 lots: ${Number(nearest.lotsize) * 5}`);
        } else {
            console.log(` ❌ No matching contracts found for ${index.search} on ${index.exch}`);
        }
        console.log('---');
    });
}

verifyIndices();
