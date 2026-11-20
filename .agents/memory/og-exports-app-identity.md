---
name: OG Exports app identity
description: The new Android package ID is intended to be a separate Play Store app.
---

The buyer mobile app must use `com.ogexports.buyer`; the current buyer build must not continue using `com.ogexports.app`. The existing `com.ogexports.app` Play Store listing is a separate app and is not deleted by changing local configuration.

**Why:** The user explicitly said the buyer app should be built separately with `com.ogexports.buyer` and asked to remove `com.ogexports.app` from its identity.

**How to apply:** Use `com.ogexports.buyer` for buyer builds and keep the investor listing separate. Do not claim the old `.app` listing was removed; changing the package only means it will not be updated by buyer builds.
