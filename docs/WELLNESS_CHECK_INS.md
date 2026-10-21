# Local wellness check-ins and Camera loading

The Camera loader follows the existing uploadDetection promise, from real image submission until success, failure, blur, or unmount. It does not initiate analysis or impose a completion timer. The dedicated components/images/loading-icon.png is a transparent RGBA PNG, 1254 x 1254 (1:1), displayed with contain. Native-driven rotation, float, breath, cream tint and staggered side decorations stop on unmount. Reduced motion uses a static illustration and activity indicator.

## Heuristics

The pure evaluator uses persisted detection timestamps and the actual angry/fear enum values for identified cats only. It ignores invalid timestamps and duplicate detection IDs without mutating history.

- Three consecutive Angry/Fearful records within a rolling 24 hours; Happy or Neutral interrupts this sequence.
- At least one Angry/Fearful record on each of three consecutive local calendar days.
- Angry/Fearful records on at least three different local days within a two-hour circular clock-time window, including across midnight.

These are app check-in heuristics, not veterinarian-validated diagnostic thresholds. Each evaluation returns the latest matching candidate per cat; similar-time context takes priority when candidates end at the same timestamp. Historical qualifying records can create a first check-in. Signatures combine cat, rule, detection IDs and time range. Existing pending/snoozed alerts block duplicate alerts for that cat; after acknowledgement, a genuinely later pattern can create another.

## State and presentation

WellnessContext is separate from CatDataContext and authentication. Account-scoped, hashed keys reuse Expo SecureStore; revision-based chunks keep values below its size limit and commit a manifest only after all chunks are written. Web uses localStorage. Only wellness metadata is stored, never complete AI responses. Existing auth keys and API contracts are unchanged.

Calendar is the safe presentation screen. Notification taps queue until an authenticated tab is free of capture, upload, permission prompts, forms and critical modals. Due check-ins display once per foreground session, including across Calendar remounts. Explicit notification taps can reopen their context. Reminder markers/cards respect cat filters and do not count as detections or affect analytics. Calendar retains its plain cream background.

Centralized wellnessGuidance reflects the supplied interview themes as questions: usual behavior, appetite/drinking, activity/hiding, litter use, physical changes, environment and routines, voluntary approach, calm interaction, and veterinary follow-up. It excludes scruffing, towel restraint, forced handling and protective-glove restraint. The UI explicitly says not to wait for a detection threshold when already concerned, and that FeELINE cannot diagnose illness or replace veterinary advice.

## Notifications and limitations

expo-notifications ~0.32.17 was added using Expo's version-aware installer and its config plugin. No remote push service, token registration or exact-alarm permission was added. First launch does not request notification access. Saving a reminder explains the permission request; previously denied access is not repeatedly requested. Denial or scheduling failure preserves the Calendar reminder and offers settings/retry guidance.

Transactions serialize saves, acknowledgement and editing. Editing cancels the old schedule first; acknowledgement/completion cancels associated notifications. Deletion requires confirmation and removes only the reminder while acknowledging its alert. Completed reminders remain in Calendar. Immediate alert delivery is recorded before scheduling to avoid duplicate phone alerts after restart; a crash at that boundary can skip a phone alert, but the pending in-app check-in remains. An interrupted reminder schedule remains visible and can be retried by editing.

Reminders do not sync across devices and may be lost after uninstalling or clearing app data. A future cross-device feature requires backend support. Delivery timing depends on OS notification, power and focus settings. Web supports in-app reminders but not native phone scheduling.

## Verification

Focused tests cover patterns/local time/DST, deduplication, storage restoration and failed writes, notification permissions/responses, reminder edits/deletes, modal guidance, Calendar filtering/presentation, and actual pending Camera promises plus animation/reduced-motion cleanup. Commands:

    node --test tests/wellnessPatterns.test.cjs tests/wellnessReminders.test.cjs tests/wellnessNative.test.cjs tests/wellnessUI.test.cjs tests/loadingOverlay.test.cjs tests/frontendRefinements.test.cjs tests/moduleBackground.test.cjs tests/loginLayout.test.cjs
    npm run lint
    npx tsc --noEmit
    npx expo-doctor
    npx expo export --platform android

Root TypeScript currently also includes backend source with unresolved backend dependencies/generated Prisma types. Frontend-only compilation is checked independently without editing backend configuration.

Physical Android/iOS checks remain: long/failed camera and gallery requests; repeated captures and tab changes; reduced-motion and screen reader behavior; short-screen modal/picker layout; first/denied/permanently denied permission; reminder editing/completion/deletion; delivery with app backgrounded/closed; notification cold/warm starts, login and busy-screen queuing; account isolation; time-zone/device-clock changes and restart restoration. A new native/development/EAS build and reinstall may be required for the added notification module/plugin. Expo Go or OTA alone is not sufficient proof of all native notification behavior.
