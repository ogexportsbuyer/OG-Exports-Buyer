---
name: Expo workflow log freshness
description: Check current Metro state when persistent logs disagree with source and platform exports.
---

When a Metro error from existing workflow output conflicts with a successful platform export or the current source, restart the managed Expo workflow and inspect its new logs before editing source. Older output may describe an earlier app state.

An Expo QR code can appear even while Expo CLI is waiting at an account prompt. Confirm the fresh workflow log reports the managed `replit-private` sign-in before treating the QR preview as ready.

**Why:** A previous workflow log showed a JSX mismatch while iOS and Android exports succeeded; a fresh restart started Metro without that parser error.

**How to apply:** After source changes, export the app as appropriate. If workflow output disagrees with those results, use the artifact-managed workflow restart and fresh logs to distinguish stale output from a live failure. For QR preview issues, also verify managed Expo sign-in completed in the new logs.

If `create-launch login` still reports an unexpected response after the user refreshes the workspace and the Expo workflow restarts, repeated restarts do not repair the managed session. For real-device network timeouts, Expo CLI's ngrok tunnel fallback can still provide a reachable Expo Go URL without the Expo-account tunnel.

**Why:** A buyer app already on SDK 58 continued to show the managed sign-in prompt and iOS timeouts after refresh, but `--tunnel ngrok` connected and served both iOS and Android manifests and bundles.

**How to apply:** Keep the guarded `create-launch` login step, but when the Expo-account tunnel fails, use `--tunnel ngrok` with `@expo/ngrok` and remove the Expo proxy/hostname overrides that take precedence over the tunnel URL. Keep the Replit API-domain variables and verify the browser route separately.
