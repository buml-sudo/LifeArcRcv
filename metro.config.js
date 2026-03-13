const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Polyfill Node built-ins not available in React Native
config.resolver.extraNodeModules = {
  punycode: require.resolve('punycode/'),
};

module.exports = config;
