const path = require('node:path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// `app` bundles a real React Native app. `standalone` and `render` bundles run in the Hermes CLI,
// so they skip React Native's startup modules. `render` also replaces the native views with host
// components that the React DOM server renderer can serialize.
const mode = process.env.QRCODESDK_METRO_MODE ?? 'app';
const stubs = {
  'react-native': path.join(__dirname, 'stubs/react-native.js'),
  'react-native-svg': path.join(__dirname, 'stubs/react-native-svg.js'),
};

const standalone = {
  resolver: {
    resolveRequest(context, moduleName, platform) {
      if (mode === 'render' && stubs[moduleName]) {
        return {type: 'sourceFile', filePath: stubs[moduleName]};
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  serializer: {
    getModulesRunBeforeMainModule: () => [],
    getPolyfills: () => [path.join(__dirname, 'stubs/globals.js')],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), mode === 'app' ? {} : standalone);
