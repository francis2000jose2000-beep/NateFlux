const path = require('path');
const dotenv = require('dotenv');

console.log('CWD:', process.cwd());
const envPath = path.resolve(process.cwd(), '../.env.local');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

console.log('TFC_TOKEN:', process.env.TFC_TOKEN ? 'Loaded' : 'MISSING');
