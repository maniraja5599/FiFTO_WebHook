
import fs from 'fs';
import path from 'path';

const instruments = JSON.parse(fs.readFileSync('public/data/instruments.json', 'utf8'));
const nifty = instruments.filter(i => i.name === 'NIFTY');
console.log(JSON.stringify(nifty, null, 2));
