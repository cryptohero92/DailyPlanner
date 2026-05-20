const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Block only this project's scripts/ dir and sharp's native binaries.
// Use escaped path.sep so patterns work on both Windows (\) and Linux (/).
const sep = path.sep === '\\' ? '\\\\' : '/';
config.resolver.blockList = [
  // Project-level scripts dir only — NOT node_modules/.../scripts/
  new RegExp(`^${path.resolve(__dirname, 'scripts').replace(/\\/g, '\\\\')}${sep}`),
  new RegExp(`node_modules${sep}sharp${sep}`),
  new RegExp(`node_modules${sep}@img${sep}`),
];

module.exports = config;
