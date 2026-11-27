---
name: Expo gallery image saving
description: SDK 58 guidance for saving app-generated receipt images to the phone gallery.
---

For Expo SDK 58, save generated images with `Asset.create(localUri)` from `expo-media-library`. The deprecated top-level `saveToLibraryAsync` is not a safe fallback and throws at runtime. Request write-only photo access only after the user chooses to save; if access is blocked, offer the system Settings screen.

**Why:** SDK 58 moved the gallery-save flow to the newer media-library API, and asking for photo access before the user's save action is unnecessary.

**How to apply:** For receipt or other generated-image saves, capture the view to a local temporary image, request photo write access on demand, then create the media-library asset. Keep PDF sharing as a separate, explicit action.
