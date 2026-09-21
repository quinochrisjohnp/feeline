# Camera refinement: implementation and validation

## Scope and files

Real image input now feeds the existing simulated detection and normalized save flow. No AI inference, backend, upload, file copying, persistent media store, navigation replacement, or unrelated screen redesign was added.

Changed for this task:

- `app/(screens)/(tabs)/camera.tsx`: focused rear CameraView, readiness/permission/error states, safe-area overlays, portrait composition guide, gallery thumbnail, processing lock and cancellation.
- `app/(screens)/camera-result.tsx`: actual image display and explicit simulated-result note, preserving normal/low/error actions.
- `app/(screens)/camera-save.tsx`: actual image preview and accurate session-only wording; existing save operation remains unchanged.
- `components/camera/MockSampleModal.tsx`: scenario selection wording; removed unrelated album action.
- `components/camera/MockCapturePhoto.tsx`: device-image wording and shared display.
- `components/common/MockPhoto.tsx`: device URI rendering alongside existing bundled images and unresolved-key placeholders.
- `services/mockDetection.ts`: separate source/image/scenario payload and strict route validation.
- `utils/mediaUri.ts` (new): local/native and Expo web image URI validation, excluding remote image URLs.
- `constants/theme.ts`: reusable viewfinder scrim, control and guide colors.
- `app.json`, `package.json`, `package-lock.json`: native packages and permission plugins.
- `tests/cameraFlow.test.cjs`, `tests/helpers/frontendHarness.cjs`, `tests/calendarFlow.test.cjs`: native module mocks, real-style URI fixtures and asynchronous lifecycle coverage.

The image fixture/album/profile edits already present before this task belong to the prior bundled-photo integration. Domain models, reducer, context, selectors, floating navigation and emotion palette were not changed here.

## Dependencies and permissions

Installed using `npx expo install expo-camera expo-image-picker`:

- `expo-camera`: `~17.0.10`
- `expo-image-picker`: `~17.0.11`

Camera and photo descriptions name FeELINE and its purpose. Both plugins set `microphonePermission: false`; camera sets `recordAudioAndroid: false`. The existing generated, gitignored Android manifest also has a RECORD_AUDIO removal rule so its dependency manifest cannot introduce audio permission when building the current local native project. Regenerated projects receive the plugin settings. Native builds must be rebuilt to include the packages/configuration; no microphone runtime request is made.

The system images-only picker does not request broad photo-library access on supported SDK 54 platforms. Cancellation stays on Camera. Picker failure leaves a retry path and a device-settings action. Camera permission is requested only by user action, with settings recovery when it cannot be requested again.

## Flow

- Capture checks permission/readiness, calls `takePictureAsync({ quality: 0.9 })`, and keeps Expo's returned URI.
- Gallery opens `launchImageLibraryAsync` with images only, one selection, no editing and quality 1.
- Either input is combined with `sampleId`, canonical ISO `capturedAt`, and `source: camera | gallery`.
- The scenario selector changes only `sampleId`. Detection remains a fixed lookup; Angry is 90%, low confidence is 20%. The image is never analyzed or replaced with a fixture.
- One operation lock prevents duplicate requests. Generation checks discard late native promises and scheduled navigation after blur/unmount. CameraView unmounts when unfocused or the app becomes inactive.
- Result and Save receive the unchanged URI and timestamp. Normal saves create the existing linked image/detection pair. Low/error results remain unsavable. Unknown Cats remains a protected album.
- Returned URIs are session references only; Expo may remove cached files later. No permanence is promised.

## Validation

- Read Expo SDK 54 camera/image-picker documentation, repository UI specification and rendered prototype page 4.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `node --test tests/*.test.cjs`: 59 passed.
- `git diff --check`: passed.
- Browser at 320 x 568: verified permission explanation/actions, disabled capture before readiness, dark edge-to-edge layout, controls above floating navigation, and scenario modal selection (Angry to Happy) without image substitution.

Tests cover deterministic results, valid camera/gallery/web URIs, malformed/array/missing parameters, timestamps and source values, actual URI forwarding into result/save, linked saves, duplicate taps, camera and gallery failures/cancellation, readiness, permission states/settings callback, camera mount retry, late completion after blur/refocus, camera unmount on blur, and existing Unknown Cats protection. Existing auth, reducer, selector, album and calendar tests remain passing.

## Required physical-device validation (not performed here)

Real camera/gallery behavior must still be verified on a physical Android or iOS device. Desktop/browser checks and mocked native tests do not establish device functionality.

Pending device checklist:

1. First camera permission request, denial, permanent denial and Open Settings.
2. Live rear preview and capture disabled before/on after camera readiness.
3. Real captured photo displayed on Result.
4. Native gallery opening, cancellation and selected image displayed on Result.
5. Scenario changes affect only the simulated result.
6. Normal save, low-confidence unsavable result and error retry.
7. Returning to Camera restarts preview; tab/deep-route changes stop it.
8. Floating navigation, composition guide and controls on small/tall phones, notches, Android edge-to-edge and bottom gesture insets.
9. Saved URI displayed in its album for the current session.

No physical phone is connected to the available browser-only inspection tools. These manual checks are explicitly pending, not claimed as passed.
