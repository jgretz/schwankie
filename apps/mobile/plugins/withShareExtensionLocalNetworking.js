const {withDangerousMod} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const plist = require('@expo/plist').default;

// expo-share-extension writes a fresh Info.plist for the share extension target
// on every prebuild, omitting the local-network keys that RCTBundleURLProvider
// needs to discover Metro in DEBUG mode. Without NSBonjourServices +
// NSLocalNetworkUsageDescription + NSAllowsLocalNetworking, the share
// extension's jsBundleURL() returns nil and Swift hits
// fatalError("Could not create bundle URL"). This plugin patches the generated
// Info.plist after expo-share-extension runs.
const withShareExtensionLocalNetworking = function (config) {
  return withDangerousMod(config, [
    'ios',
    function (cfg) {
      const iosRoot = cfg.modRequest.platformProjectRoot;
      const name = 'SchwankieShareExtension';
      const plistPath = path.join(iosRoot, name, 'Info.plist');

      if (!fs.existsSync(plistPath)) return cfg;

      const contents = fs.readFileSync(plistPath, 'utf8');
      const parsed = plist.parse(contents);

      parsed.NSBonjourServices = ['_expo._tcp'];
      parsed.NSLocalNetworkUsageDescription =
        'Expo Dev Launcher uses the local network to discover and connect to development servers running on your computer.';

      parsed.NSAppTransportSecurity = {
        ...(parsed.NSAppTransportSecurity || {}),
        NSAllowsLocalNetworking: true,
      };

      fs.writeFileSync(plistPath, plist.build(parsed));
      return cfg;
    },
  ]);
};

module.exports = withShareExtensionLocalNetworking;
