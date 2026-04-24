const {withXcodeProject} = require('@expo/config-plugins');

// Copies MARKETING_VERSION and CURRENT_PROJECT_VERSION from the main app target
// onto every other native target (share extension, widgets, etc.) so EAS
// `autoIncrement: true` bumps don't leave extensions behind and trip codesign
// ("CFBundleVersion of an app extension must match its containing parent app").

function stripQuotes(s) {
  return typeof s === 'string' ? s.replace(/^"|"$/g, '') : s;
}

function getBuildSettingsForTarget(xcodeProject, targetUuid) {
  const nativeTargets = xcodeProject.pbxNativeTargetSection();
  const configList = xcodeProject.pbxXCConfigurationList();
  const buildConfigs = xcodeProject.pbxXCBuildConfigurationSection();
  const target = nativeTargets[targetUuid];
  if (!target || typeof target !== 'object') return [];
  const list = configList[target.buildConfigurationList];
  if (!list) return [];
  return list.buildConfigurations
    .map((ref) => buildConfigs[ref.value] && buildConfigs[ref.value].buildSettings)
    .filter(Boolean);
}

function syncExtensionVersions(xcodeProject, mainTargetName) {
  const nativeTargets = xcodeProject.pbxNativeTargetSection();

  let mainVersion;
  let mainBuildNumber;
  for (const [uuid, target] of Object.entries(nativeTargets)) {
    if (uuid.endsWith('_comment')) continue;
    if (stripQuotes(target.name) !== mainTargetName) continue;
    for (const settings of getBuildSettingsForTarget(xcodeProject, uuid)) {
      if (settings.MARKETING_VERSION) mainVersion = settings.MARKETING_VERSION;
      if (settings.CURRENT_PROJECT_VERSION) mainBuildNumber = settings.CURRENT_PROJECT_VERSION;
    }
  }

  if (!mainVersion && !mainBuildNumber) {
    console.warn('[sync-extension-version] main target has no version settings to sync');
    return {touched: 0, mainVersion, mainBuildNumber};
  }

  let touched = 0;
  for (const [uuid, target] of Object.entries(nativeTargets)) {
    if (uuid.endsWith('_comment')) continue;
    if (stripQuotes(target.name) === mainTargetName) continue;
    for (const settings of getBuildSettingsForTarget(xcodeProject, uuid)) {
      if (mainVersion) settings.MARKETING_VERSION = mainVersion;
      if (mainBuildNumber) settings.CURRENT_PROJECT_VERSION = mainBuildNumber;
      touched++;
    }
  }
  return {touched, mainVersion, mainBuildNumber};
}

function withSyncExtensionVersion(config) {
  return withXcodeProject(config, function (config) {
    syncExtensionVersions(config.modResults, config.modRequest.projectName);
    return config;
  });
}

module.exports = withSyncExtensionVersion;
module.exports.syncExtensionVersions = syncExtensionVersions;
