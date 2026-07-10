const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchDir(filePath);
    } else if (filePath.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('next(')) {
        console.log(`File: ${filePath}`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('next(')) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir(path.join(__dirname, '../src'));
