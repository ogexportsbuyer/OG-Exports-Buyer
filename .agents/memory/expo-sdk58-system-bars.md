---
name: Expo SDK 58 Android system bars
description: Android edge-to-edge and navigation-bar behavior in Expo Go versus installed builds.
---

Expo SDK 58 uses Android edge-to-edge system bars. React Native's current `StatusBar` typings no longer expose the older `translucent` or `backgroundColor` props. Theme-aware status/navigation icon styles and a matching root background can be applied at runtime, but the `expo-navigation-bar` contrast plugin only affects a native app build; Expo Go does not apply the project's config plugin.

**Why:** Android 15 enforces edge-to-edge, and SDK 58 removed older runtime navigation-bar background controls. Expo Go can therefore keep a system-owned navigation-bar contrast area even when the project requests transparent bars.

**How to apply:** Keep screen content safe with insets, set system icon styles to contrast with the resolved theme, and use `expo-navigation-bar`'s `enforceContrast: false` plugin setting for installed builds. Do not promise the full native navigation-bar appearance from an Expo Go preview without a native build.
