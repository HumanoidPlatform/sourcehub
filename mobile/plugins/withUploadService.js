// Expo config plugin: what the Android manifest needs for uploads to carry on
// in the background (src/upload/service.ts, react-native-background-actions).
//
// The library declares its service but not what KIND of foreground service
// it is, and Android 14 refuses to start one without that. This adds the
// permissions and marks the service as dataSync — the type for moving the
// user's own data — on the merged manifest. Only Android; iOS is untouched.
//
// Runs at prebuild, so a change here needs a new build, not an update.

const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

const SERVICE = "com.asterinet.react.bgactions.RNBackgroundActionsTask";
const PERMISSIONS = [
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_DATA_SYNC",
  "android.permission.WAKE_LOCK",
];

module.exports = function withUploadService(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults;
    AndroidConfig.Permissions.ensurePermissions(manifest, PERMISSIONS);
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    app.service = app.service ?? [];
    let service = app.service.find((s) => s.$["android:name"] === SERVICE);
    if (!service) {
      service = { $: { "android:name": SERVICE } };
      app.service.push(service);
    }
    // merged with the library's own <service> element by name; it declares
    // no type, so nothing conflicts and no tools:replace is needed
    service.$["android:foregroundServiceType"] = "dataSync";
    service.$["android:exported"] = "false";
    return mod;
  });
};
