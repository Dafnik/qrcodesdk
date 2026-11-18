# React Native example and simulator tests

This Expo app renders the local `@qrcodesdk/react-native` package with real native views. It
includes SVG, PNG, WebP, GIF, JPEG, and rounded modules. Every format also renders with the
QRCodeSDK logo as a center image. The controls also exercise payload updates and the image
components' `toDataURL()` refs.

The cases come from `fixtures.json`, which the app, the generated Maestro flow, and the screenshot
verifier share. SVG uses the bundled logo asset. The image components need PNG bytes, so
`center-logo.ts` embeds a 128 px copy of the same logo. A unit test fails when it no longer matches
the asset. After changing the logo, regenerate it:

```sh
pnpm turbo run generate:center-logo --filter=native-example
```

Run every command below from the workspace root. Install workspace dependencies with `pnpm install`
first. Expo SDK 58 uses React Native 0.88.1. Keep the app's React and native dependencies aligned
with the library's development dependencies so Metro loads one copy of each.

## Interactive development

Install Xcode 26.4 or newer and an iOS 16.4 or newer simulator runtime for iOS, or Android Studio,
Android SDK 37, and an emulator for Android. Native builds also require CocoaPods on macOS and
Java 17 for Android.
Follow Expo's [iOS setup](https://docs.expo.dev/workflow/ios-simulator/) or
[Android setup](https://docs.expo.dev/workflow/android-studio-emulator/).

```sh
pnpm turbo run ios --filter=native-example
# Or, with an Android emulator running:
pnpm turbo run android --filter=native-example
```

These commands generate ignored native projects, compile and install the app, and start Metro.
After the first native build, start only Metro with:

```sh
pnpm turbo run start --filter=native-example
```

For library changes, keep a second terminal rebuilding the library and its dependencies:

```sh
pnpm turbo watch build --filter=@qrcodesdk/react-native
```

The start task also works with Expo Go. Use a native build to test the exact image decoder
configuration used in CI. `expo-build-properties` explicitly enables Android GIF and WebP support.
Native projects are generated from `app.json`; after changing native configuration, regenerate or
remove the ignored `ios` and `android` directories before rebuilding.

## Automated simulator tests

Install Java 17 or newer for Maestro, then install the pinned Maestro archive into the app's
ignored `.tools` directory. The installer verifies its SHA-256 checksum before extracting it.

```sh
pnpm turbo run native:tools --filter=native-example
pnpm turbo run test:native:ios --filter=native-example
# Or, with one Android emulator running:
pnpm turbo run test:native:android --filter=native-example
```

The iOS task boots an available iPhone simulator and installs its build with `simctl`. It does not
need to open the Simulator window or control System Events with AppleScript. To select an iPhone UDID or Android emulator
serial explicitly, set `QRCODESDK_NATIVE_DEVICE` on the command. Android also accepts `ANDROID_SERIAL`.
The task installs a release build with embedded JavaScript, runs a generated Maestro flow, then
decodes every screenshot with the repository's ZXing decoder. It fails for missing screenshots,
unreadable codes, or incorrect payloads, including stale rendering after a payload update.
The decoder scans multiple symbols because the logo contains its own QR code. Center-image
screenshots must also contain the logo's yellow color, so an unloaded logo cannot pass
just because the surrounding QR code remains readable.
For each image component, the app then replaces the live component with an `Image` of the data URL
returned by `toDataURL()`. That screenshot must decode to the same payload, so the exported bytes
are checked as well as their MIME type. Tests need no Expo account, cloud build service, signing
credentials, Metro server, or network image assets.

On Android, the task hides system error dialogs on the emulator. The flow also taps **Wait** on
any "isn't responding" dialog, because a stalled system app such as the launcher can otherwise
cover the app on a slow emulator.

Every command has a deadline: 45 minutes for native builds, 20 minutes for the Maestro flow, and
10 minutes or less for other steps. A hung simulator, emulator, or build fails the task.

The iOS release build targets only the host's simulator architecture, `arm64` on Apple silicon or
`x86_64` on Intel. Its generated Xcode settings apply to the app, Pods, and nested framework builds.
Before each build, Expo reapplies the native app configuration. JavaScript and assets are bundled
for every build, and the test task always runs Maestro and screenshot decoding.

To enable the optional compiler cache locally, install the pinned ccache release. The task
verifies its SHA-256 checksum and installs it into the app's ignored `.tools/bin` directory:

```sh
pnpm turbo run native:cache:ios --filter=native-example
USE_CCACHE=1 pnpm turbo run test:native:ios --filter=native-example
pnpm turbo run native:cache:ios --filter=native-example -- --stats
```

`expo-build-properties` enables ccache when it is on `PATH`. `USE_CCACHE=1` puts the pinned binary
on `PATH` for the build and clears the counters first, so the reported statistics describe that
run. `CCACHE_DIR` and
`CCACHE_MAXSIZE` can configure its location and storage limit.

To rerun the flow against an already installed app without rebuilding, append `-- --skip-build`.
Reinstall after app or library changes before using this option. CI always builds the app.

Screenshots, decoded payloads, Maestro diagnostics, the generated flow, and a JUnit report are written under
`apps/native-example/artifacts/ios` or `artifacts/android`. Each run clears that platform's old
artifacts so stale screenshots cannot pass a new run. Failed native builds also fail the task.

The screenshot verifier has fast tests covering readable, blank, stale, missing, and duplicate
screenshots. Run them and the app's JavaScript bundle checks without a simulator:

```sh
pnpm turbo run test check-types lint build --filter=native-example
```

These simulator tests supplement the library's unit tests and installed-package Hermes smoke
tests. They exercise workspace builds; the existing smoke tests separately cover packed artifacts.
They check decoded content rather than exact screenshot pixels. They do not establish performance,
camera scanning quality, or support for every OS and device.

## CI

The Development workflow runs the same native tasks on an iPhone simulator on macOS and an Android
API 35 emulator on Linux for pull requests and pushes to `main` and `develop`. Both jobs are part
of the existing `required` gate. They upload screenshots and reports even when tests fail, with
seven-day retention. Native tasks disable Turbo caching so a cached result never skips a device run.

The iOS job caches CocoaPods downloads and metadata, React Native and Hermes downloads, and a
separate 500 MB ccache directory. Keys include the runner OS and architecture, Xcode and ccache
versions, dependency lockfile, and native app configuration. The compiler cache restores the latest
entry for the same dependencies, or else the latest for the same toolchain. ccache finds objects by
content, so an older entry cannot produce stale objects. Only pushes to `main` and `develop` save a
new entry, so pull request runs cannot evict other caches. Pull requests restore their base branch's
entries. CI reports cache statistics after testing. The final app binary and simulator test results
are always rebuilt and checked.
