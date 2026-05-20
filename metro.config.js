const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude non-JS directories from Metro's file watcher to avoid
// Windows long-path errors and unnecessary scanning of native binaries
config.resolver.blockList = [
  /scripts\/.*/,
  /node_modules\/sharp\/.*/,
  /node_modules\/@img\/.*/,
];

module.exports = config;
