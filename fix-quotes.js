const fs = require('fs');
const path = 'biohostel.com/src/app/cookies/page.tsx';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/use client;/g, 'use client;');
fs.writeFileSync(path, c);
console.log('Done');