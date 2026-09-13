# Known limitations

## Native Expo / React Native

The original specification asks for an Android Offline app built with React Native/Expo and tested through Expo Go. This deliverable is the WebDev/browser adaptation required by the available game-dev pipeline: React 19 + Babylon.js + WebGL. It is not an APK and it has not been tested on a physical Android device through Expo Go.

A true native version should evaluate `expo-gl` or a Development Build with a supported 3D renderer, because Expo Go cannot guarantee compatibility with arbitrary native physics/rendering modules. A production Android build would likely need a Development Build rather than Expo Go for advanced 3D and native audio integration.

## Motion control

The browser implementation listens to `DeviceOrientationEvent` and clamps `gamma` to a gradual steering range. Some browsers require a user gesture or explicit permission, and desktop preview environments do not provide a real sensor. The UI therefore keeps Motion selectable but does not pretend a sensor was verified when none exists.

## Local music

The browser implementation uses an `<input type="file" accept="audio/*">` and a local blob URL. This works for the active browser session, but does not provide Android media-library indexing, system notification controls, gapless next/previous track queues, or background audio focus. Those require native Expo modules or a Development Build and are intentionally not claimed here.

## Vehicle audio

The engine sound is a dynamic, state-dependent Web Audio blend of idle/low/high RPM layers with throttle and braking modulation. It is functional and offline, but it is synthesized rather than a licensed field recording. A native release can replace or augment the layers with CC0/CC-BY assets after license review.

## Persistence

Active UI choices are held in the browser session. Native Android persistence and cross-session settings require local storage/AsyncStorage wiring in an Expo build.

## External assets

No third-party GitHub code or asset is bundled. The generated assets and procedural meshes are used to keep licensing and offline packaging deterministic. GitHub research results are retained as a recommendation input only; they do not silently enter the build.
