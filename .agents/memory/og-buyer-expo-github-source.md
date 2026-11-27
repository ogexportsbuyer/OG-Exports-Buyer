---
name: OG Buyer Expo GitHub source
description: Keep Buyer production builds on the repository linked to its Expo project.
---

For Buyer (`com.ogexports.buyer`), EAS uses GitHub repository `ogexportsbuyer/OG-Exports-Buyer`, which can differ from the workspace's `origin` (`ogexp/ogexports`). The previously successful 1.1.5 build used the `release/ogexports-app-1.1.5` branch; the Expo app directory is `artifacts/mobile`.

**Why:** The EAS build metadata matched the dedicated Buyer repository, and its successful build commit was an ancestor of the latest workspace source. Pushing to the workspace remote failed, while the Expo-linked repository accepted a new release branch.

**How to apply:** Before Buyer AAB builds, verify the repository from Expo build history, push current code to a new versioned branch in that linked repository, use `artifacts/mobile` as the base directory, and leave auto-submit disabled unless separately requested.
