const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walk(filepath, callback);
      }
    } else {
      callback(filepath);
    }
  }
}

console.log("Searching for 'PENDING' in source files...");
walk('src', (filepath) => {
  const content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('PENDING')) {
    console.log(`Found in: ${filepath}`);
  }
});
