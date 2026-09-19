// Runs on top of app.json, which stays the base config — Expo reads app.json
// first and hands it here, and the Expo tools can still write to it (eas init
// did). This file exists for one decision that a static file cannot make.
//
// PLAIN HTTP IS A DEVELOPMENT CONVENIENCE, NOT SOMETHING A WORKER'S BUILD MAY DO.
//
// app.json allows cleartext traffic on both platforms because a developer's
// laptop on the desk serves the API over http://. A build a worker installs
// talks to one HTTPS address (src/config.ts) and has no reason to be able to
// speak http:// to anything — so for those builds the permission is removed
// from the binary itself, where no over-the-air update can put it back.
//
// EAS sets EAS_BUILD_PROFILE during a cloud build. Unset means a local run
// (`expo start`, `expo run:android`), which is development.

module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  if (!profile || profile === "development") return config;

  const infoPlist = { ...(config.ios?.infoPlist ?? {}) };
  delete infoPlist.NSAppTransportSecurity; // iOS: back to the default, HTTPS only

  const plugins = (config.plugins ?? []).map((p) =>
    Array.isArray(p) && p[0] === "expo-build-properties"
      ? [p[0], { ...p[1], android: { ...(p[1]?.android ?? {}), usesCleartextTraffic: false } }]
      : p,
  );

  return { ...config, ios: { ...config.ios, infoPlist }, plugins };
};
