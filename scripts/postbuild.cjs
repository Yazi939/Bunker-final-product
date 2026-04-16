const fs = require('fs');
const path = require('path');

const copies = [
  ['src', 'database', 'api.js'],
  ['src', 'database', 'queries.js'],
];

for (const segments of copies) {
  const source = path.join(__dirname, '..', ...segments);
  const destination = path.join(__dirname, '..', 'build', ...segments.slice(1));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
