---
name: OG Exports app identity
description: The new Android package ID is intended to be a separate Play Store app.
---

Treat `com.ogexports.app` as a separate app listing; it does not replace or migrate `com.ogexports.investor`.

**Why:** The user explicitly chose a new package as a separate Play Store app after learning that package IDs cannot be changed for an existing Play listing.

**How to apply:** Keep existing investor installs and listing on `com.ogexports.investor`; use `com.ogexports.app` only for the separately registered listing.

The buyer marketplace app must use package ID `com.ogexports.buyer` and have its own Play Store listing.

**Why:** The user explicitly specified the buyer app's package and separate listing.

**How to apply:** Before changing the current Expo app identity, confirm whether to preserve the existing `com.ogexports.app` listing or repurpose this workspace; do not silently replace an existing store identity.
