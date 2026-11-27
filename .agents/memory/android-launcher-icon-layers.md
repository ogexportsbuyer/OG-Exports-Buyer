---
name: Android launcher icon layers
description: Prevent Android adaptive launcher icons from appearing shrunken or inset.
---

Android adaptive launcher icons need transparent foreground artwork composed over a separate background. Do not configure a full opaque app-icon image as the foreground.

**Why:** The launcher scales and masks the foreground independently; an opaque image that already includes its background looks like a small inset square.

**How to apply:** Use a full composite PNG for iOS/general icon fields, and a transparent, safe-zone-sized PNG plus a separate solid or image background for Android adaptive icons.
