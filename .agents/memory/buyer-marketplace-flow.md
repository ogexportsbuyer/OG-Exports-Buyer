---
name: Buyer marketplace flow
description: Product discovery and account navigation expectations for the OG Exports mobile app.
---

The OG Exports mobile app is buyer-only. Guests can browse the public catalogue; cart, account, and order actions require buyer sign-in or registration. Registration has no account-type choice or investor-signup link, and investor-only sessions/routes must not enter the buyer app. Do not delete investor accounts or data. After buyer authentication, return users to the route they requested.

**Why:** The user specified that the complete mobile app—not just its registration form—is for buyers only.

**How to apply:** Use the existing Laravel product, cart, quotation, and order APIs. Keep the catalogue public, enforce buyer-only actions with backend role protection, and do not replace real catalogue data with mock products.

The Replit browser preview cannot read the production catalogue because the API does not allow that preview origin via CORS, although the public catalogue endpoints respond successfully to direct requests.

**Why:** Browser preview requests are subject to CORS; native iOS and Android requests are not.

**How to apply:** Treat browser-preview CORS errors as a preview limitation, not proof that native requests fail. Verify the API endpoints directly and test the flow in Expo Go or an installed build.
