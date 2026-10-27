const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const html = fs.readFileSync(path.join(frontend, 'index.html'), 'utf8');
const assetRefs = [...html.matchAll(/(?:src|href)=["']((?:css|js)\/[^"']+)["']/g)].map(match => match[1]);
const missingAssets = assetRefs.filter(asset => !fs.existsSync(path.join(frontend, asset)));

if (missingAssets.length) {
  console.error(`Missing frontend assets: ${missingAssets.join(', ')}`);
  process.exit(1);
}

const sourceDirs = ['backend', 'frontend/js'];
const jsFiles = sourceDirs.flatMap(directory => {
  const walk = current => fs.readdirSync(current, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && entry.name === 'node_modules') return [];
    const file = path.join(current, entry.name);
    return entry.isDirectory() ? walk(file) : (entry.isFile() && file.endsWith('.js') ? [file] : []);
  });
  return walk(path.join(root, directory));
});

for (const file of jsFiles) {
  new vm.Script(fs.readFileSync(file, 'utf8'), { filename: path.relative(root, file) });
}

const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
if (!vercel.routes?.some(route => route.src === '/api/(.*)' && route.dest === 'backend/server.js')) {
  throw new Error('Vercel API routing to backend/server.js is missing.');
}

const rootPackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const backendPackage = JSON.parse(fs.readFileSync(path.join(root, 'backend/package.json'), 'utf8'));
const missingRuntimeDependencies = Object.keys(backendPackage.dependencies || {})
  .filter(dependency => !rootPackage.dependencies?.[dependency]);
if (missingRuntimeDependencies.length) {
  throw new Error(`Vercel root package is missing backend runtime dependencies: ${missingRuntimeDependencies.join(', ')}`);
}

console.log(`Build verification passed: ${assetRefs.length} frontend assets, ${jsFiles.length} JavaScript files, and Vercel runtime dependencies checked.`);
