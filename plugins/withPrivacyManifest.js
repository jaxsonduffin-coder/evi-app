// =============================================
// EVI - Expo Config Plugin: Copy iOS Privacy Manifest into the build
// =============================================

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withPrivacyManifest = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosRoot = config.modRequest.platformProjectRoot;

      // Find the actual .xcodeproj folder (there should only be one)
      const source = path.join(projectRoot, 'ios-privacy', 'PrivacyInfo.xcprivacy');

      // Locate the main app target folder (usually the one containing Info.plist)
      const contents = fs.readdirSync(iosRoot);
      const projectFolders = contents.filter((f) =>
        fs.statSync(path.join(iosRoot, f)).isDirectory() &&
        fs.existsSync(path.join(iosRoot, f, 'Info.plist'))
      );

      if (projectFolders.length === 0) {
        console.warn('withPrivacyManifest: no app target folder found in iOS project');
        return config;
      }

      const targetFolder = projectFolders[0];
      const destination = path.join(iosRoot, targetFolder, 'PrivacyInfo.xcprivacy');

      if (fs.existsSync(source)) {
        fs.copyFileSync(source, destination);
        console.log(`✅ Copied PrivacyInfo.xcprivacy to ${destination}`);
      } else {
        console.warn(`withPrivacyManifest: source not found: ${source}`);
      }

      return config;
    },
  ]);
};

module.exports = withPrivacyManifest;
