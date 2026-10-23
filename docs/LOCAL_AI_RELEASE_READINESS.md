# Local AI release readiness — 2026-10-23

No deployment, push, commit, environment change, or database migration was performed.

## Build repair

The backend now runs `prisma generate` before `tsc`. The generated client remains ignored. Generation can run without DATABASE_URL; runtime still requires it in src/config/db.config.ts. No migrate, db push, or introspection command is part of the build.

Frontend TypeScript excludes the separately compiled backend. ESLint excludes generated client/build files, not backend source.

The AI Docker build uses the supplied model files and checks that all three models load with the existing pinned CPU packages. The obsolete EfficientNet weights download is removed; legacy source files remain untouched.

## Local validation

- Backend `npm ci --ignore-scripts --no-audit --no-fund`: completed with the existing lockfile, unchanged versions.
- Backend `npm run build`: passed (Prisma 7.10.0 generation + TypeScript).
- Frontend `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `npm run lint`: no errors; existing AddCatForm dependency warning.
- Focused frontend detection/refinement tests: 31 passed.
- Backend injected-dependency contract tests: 8 passed; no external storage calls.
- AI contract tests: 6 passed.
- All three real models loaded on CPU in the existing detector_env.
- Full frontend suite after migration to the current API contract: 128 passed, 0 failed. The earlier 23 failures came from obsolete mock module/seeded-state/auth expectations and unmocked native dependencies. Explicit fixtures remain test-only. API provider and asynchronous batch removal now have focused coverage.

## Gates before production approval

1. Automated frontend suite is green. Perform physical-phone capture/gallery/result/save regression checks.
2. Build the AI Docker image in a Docker-capable environment. No Windows Docker executable was found. An Ubuntu 24.04 WSL distribution exists but is stopped; no Docker engine was started or installed. Local Torch 2.14 CPU execution does not prove compatibility with Docker's pinned Torch 2.5.1 CPU runtime. Do not change those pins without approval.
3. Include the new validator weights and threshold JSON with the integration files. Existing .gitattributes covers ai/**/*.pt with Git LFS. Confirm all three weights arrive as actual binary files in the deployment build context, not LFS pointer text. The Docker size and model-load checks fail closed if they do not. Do not fetch a different main branch during the build.
4. Review effective backend configuration securely before deployment: AI_SERVICE_URL, DATABASE_URL, JWT_SECRET, Cloudinary values, and existing auth configuration. A follow-up read-only effective variable-name listing for feeline includes DATABASE_URL and SMTP/feedback names but not AI_SERVICE_URL, JWT_SECRET, or the three CLOUDINARY_* names. Values are redacted by OAuth. These required names must be supplied/reviewed by the owner before the new backend can work. No values were changed. AI_SERVICE_URL must target the intended AI service, not a loopback address.
5. The current local Expo .env targets http://192.168.100.235:3000, not Railway. No listener was found on ports 3000/8000/8080 during the local netstat check. This does not prove which URL an already-installed phone binary contains. If the phone uses this LAN target, it needs a running reachable local backend; deploying Railway alone will not change that target. Do not change the environment URL without approval. Never paste secrets into release notes.
6. Obtain explicit approval for the exact commit/push and coordinated backend/AI deployment. Both services track main; a push can trigger automatic production builds. Preserve old successful deployment IDs for rollback planning, and account for old/new client response compatibility during the transition.
7. After an approved rollout, verify readiness, structured responses and phone behavior. A production success prediction can upload/store data; do not send test images without authorization.

## Inspected services only

Project asset_management (4d423675-8173-4636-b28d-c8e3c7ce6516), production.

- feisty-purpose: successful AI deployment 144e2bfd-84f6-48d5-a337-1595fdafb495, commit 20949b9, October 16.
- feeline: successful backend deployment b2c93fd7-cdce-40a3-8b01-c04f0dcdcef4, commit 4102523, September 28. October 21 build failed on missing generated Prisma client and resulting type errors.
- Postgres-8gr1: successful deployment with normal checkpoints in inspected logs; no data queried or changed.
## Follow-up app fix and exact files changed

Album batch removal now awaits the API, blocks duplicate confirmation/cancellation while pending, preserves history, and shows retry text on failure instead of premature success. No backend logic or production data changed in this follow-up.

- app/(screens)/album-folder.tsx
- tests/albumFlow.test.cjs
- tests/authNavigation.test.cjs
- tests/calendarFlow.test.cjs
- tests/cameraFlow.test.cjs
- tests/catData.test.cjs
- tests/helpers/frontendHarness.cjs
- tests/mockPhoto.test.cjs
- tests/polish.test.cjs
- tests/settingsFlow.test.cjs
- tests/apiProvider.test.cjs (new)
- tests/helpers/domainFixture.cjs (new)
- tests/helpers/predictionFixture.cjs (new)
- docs/LOCAL_AI_RELEASE_READINESS.md

Final follow-up checks: 128 frontend tests pass; frontend TypeScript and backend generation/build pass; lint has zero errors and one existing AddCatForm warning; git diff --check passes. app.json SHA256 remains 33E0CCB870498FE186431D344198CB35097B19043736DDEBF3093B8AAA84982C. Lockfiles, dependency versions and database schema are unchanged.
