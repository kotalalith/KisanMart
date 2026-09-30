const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(path.join(dir, f));
    }
  });
}

walkDir('.', (filePath) => {
  if (filePath.endsWith('.json')) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim()) {
        JSON.parse(content);
      }
    } catch (e) {
      console.log(`INVALID JSON: ${filePath}`);
      console.log(e.message);
      console.log('---');
    }
  }
});
