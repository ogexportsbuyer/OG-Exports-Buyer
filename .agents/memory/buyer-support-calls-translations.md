---
name: Buyer support calls and translations
description: User-approved direction for multilingual buyer chat, voice processing, and future support calls.
---

Keep buyer messaging and future voice/video calls inside the buyer support chat. The user said calls should reach the admin mobile app, which is a later product milestone; do not substitute an external phone number or claim calls work before that receiving app exists.

Voice-note transcription must be opt-in per support conversation and capped. The user supplied Google Cloud Speech-to-Text for voice input and approved a 50-minute monthly cap. Text translation is already intended to use Google Cloud Translation with its approved monthly character cap. The desired language bridge is buyer-language to Urdu for staff, and Urdu replies back to the buyer's language. Voice playback and real-time calls still depend on separate TTS and calling infrastructure.

**Why:** The user explicitly described the buyer-chat to future-admin-app call route and approved capped Google processing instead of an uncapped paid feature.

**How to apply:** Preserve the existing chat as the buyer's communication entry point. Get consent before sending recordings to providers, enforce usage caps on the server, and distinguish completed text/voice-note translation from still-unbuilt synthesized audio or live calling.
