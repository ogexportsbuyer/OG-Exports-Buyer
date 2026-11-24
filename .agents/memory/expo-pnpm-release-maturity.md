---
name: Expo package release maturity
description: Safe handling of SDK-required Expo packages that have not cleared pnpm's release-age policy
---

If Expo's SDK compatibility check requires a native-module version that has not cleared the workspace's `minimumReleaseAge`, do not lower the policy or add a package exclusion. An apparently close earlier patch is not acceptable unless Expo's matching dependency matrix confirms it. If no mature compatible set exists, restore the verified pre-upgrade package and lockfile state and retry the migration later.

**Why:** `expo install --fix` can change the SDK package before a later native-module install is rejected, leaving the app with mixed React Native peers; using an older module patch can still fail Expo's exact compatibility check.

**How to apply:** During Expo SDK migrations, inspect the exact expected module versions and their publication times. If the age gate blocks the matching set, stop the migration, restore the known-good checkpoint, run a frozen install, and verify the original Expo checks.
