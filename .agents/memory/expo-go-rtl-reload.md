---
name: Language switching without app restarts
description: Apply Urdu/Arabic direction changes reactively without reloading the mobile app.
---

Do not call `I18nManager.forceRTL()` or `reloadAppAsync()` when a signed-in user changes language. Derive RTL from the saved preference and apply it through reactive layout and text styles, preserving the current route and session.

**Why:** Forcing native RTL direction can restart both installed builds and Expo Go, interrupting the signed-in user and their current work.

**How to apply:** Keep language and direction state in the preferences provider, set web `document.dir` where needed, and use React Native `direction`/`writingDirection` styles on native screens. Verify Urdu/Arabic switching without leaving the current screen.
