const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const oldAssetsDir = path.join(distDir, 'assets', 'node_modules');
const newAssetsDir = path.join(distDir, 'assets', 'fonts');

// 1. Rename the folder
if (fs.existsSync(oldAssetsDir)) {
  fs.renameSync(oldAssetsDir, newAssetsDir);
  console.log('Renamed dist/assets/node_modules to dist/assets/fonts');
} else {
  console.log('No dist/assets/node_modules folder found.');
}

// 2. Find and replace in JS files
const jsDir = path.join(distDir, '_expo', 'static', 'js', 'web');
if (fs.existsSync(jsDir)) {
  const files = fs.readdirSync(jsDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const filePath = path.join(jsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('assets/node_modules')) {
        content = content.replace(/assets\/node_modules/g, 'assets/fonts');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated paths in ${file}`);
      }
    }
  }
}
