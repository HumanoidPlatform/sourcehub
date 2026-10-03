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

const fs = require("fs");
const path = require("path");

// PUSH NEEDS FIREBASE ON ANDROID, EVEN THROUGH EXPO'S PUSH SERVICE.
//
// google-services.json comes from the Firebase project, which lists one
// Android app per package this build can carry (com.cosarathi.capture and its
// .dev, .staging and .video variants). It is client configuration, not a
// secret. The server-side key that lets Expo send through FCM lives in EAS
// (eas credentials → Android → FCM V1), never here. Without the file the app
// still builds and runs; it just cannot get a push token (Settings says so).
const GOOGLE_SERVICES = "./google-services.json";
const hasGoogleServices = fs.existsSync(path.join(__dirname, GOOGLE_SERVICES));

module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;

  // A VARIANT INSTALLS BESIDE THE PILOT APP RATHER THAN OVER IT.
  //
  // Android identifies an app by its package, so a build carrying
  // com.cosarathi.capture replaces a worker's pilot app — or refuses to
  // install, if it was signed with a different key. A suffix gives the build
  // its own package, its own name in the launcher, and with them its own
  // storage, login and outbox, so testing cannot spill into anyone's work.
  //
  // APP_VARIANT is the suffix, set per build profile in eas.json. Unset — which
  // is every profile a worker ever receives — leaves the real app untouched.
  const variant = process.env.APP_VARIANT;
  const suffix = variant ? `.${variant}` : "";
  const named = {
    ...config,
    name: variant ? `${config.name} (${variant})` : config.name,
    ios: { ...config.ios, bundleIdentifier: config.ios.bundleIdentifier + suffix },
    android: {
      ...config.android,
      package: config.android.package + suffix,
      ...(hasGoogleServices ? { googleServicesFile: GOOGLE_SERVICES } : {}),
    },
  };

  // The cleartext decision is about the PROFILE, not the variant: a build that
  // talks to a laptop keeps plain HTTP, and anything else has it removed from
  // the binary. The two are separate on purpose — a dev variant needs http://
  // to reach a machine on the wifi, while the video variant is a real build
  // handed to real people and must not be able to speak http:// at all.
  if (!profile || profile === "development" || profile === "dev") return named;

  const infoPlist = { ...(named.ios?.infoPlist ?? {}) };
  delete infoPlist.NSAppTransportSecurity; // iOS: back to the default, HTTPS only

  const plugins = (named.plugins ?? []).map((p) =>
    Array.isArray(p) && p[0] === "expo-build-properties"
      ? [p[0], { ...p[1], android: { ...(p[1]?.android ?? {}), usesCleartextTraffic: false } }]
      : p,
  );

  return { ...named, ios: { ...named.ios, infoPlist }, plugins };
};
