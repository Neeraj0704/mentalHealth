const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// @elevenlabs/* packages only have an `exports` field (no `main`), which Metro
// doesn't resolve by default. Map each package to its concrete dist file.
const ELEVENLABS_MAP = {
  '@elevenlabs/react-native': path.resolve(
    __dirname,
    'node_modules/@elevenlabs/react-native/dist/index.react-native.js',
  ),
  '@elevenlabs/react': path.resolve(
    __dirname,
    'node_modules/@elevenlabs/react/dist/index.js',
  ),
  '@elevenlabs/client': path.resolve(
    __dirname,
    'node_modules/@elevenlabs/client/dist/index.js',
  ),
  '@elevenlabs/client/internal': path.resolve(
    __dirname,
    'node_modules/@elevenlabs/client/dist/internal.js',
  ),
  '@elevenlabs/types': path.resolve(
    __dirname,
    'node_modules/@elevenlabs/types/dist/src/index.js',
  ),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (Object.prototype.hasOwnProperty.call(ELEVENLABS_MAP, moduleName)) {
    return { filePath: ELEVENLABS_MAP[moduleName], type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
