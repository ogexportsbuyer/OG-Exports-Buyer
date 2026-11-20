---
name: Buyer marketplace flow
description: Product discovery and account navigation expectations for the OG Exports mobile app.
---

The buyer experience belongs in the existing OG Exports mobile app. Guests should be able to browse the public product catalogue, while cart, account, and order actions ask them to sign in or register. Registration is buyer-only with no account-type choice or investor-signup link. Keep existing investor session routing unless the user asks to remove it. After authentication, return the user to the route they requested.

**Why:** The user requested a buyer storefront in the same app and later specified that its registration UI is for buyers only.

**How to apply:** Use the existing Laravel product, cart, quotation, and order APIs. Keep the catalogue public, enforce buyer-only actions with backend role protection, and do not replace real catalogue data with mock products.

The Replit browser preview cannot read the production catalogue because the API does not allow that preview origin via CORS, although the public catalogue endpoints respond successfully to direct requests.

**Why:** Browser preview requests are subject to CORS; native iOS and Android requests are not.

**How to apply:** Treat browser-preview CORS errors as a preview limitation, not proof that native requests fail. Verify the API endpoints directly and test the flow in Expo Go or an installed build.
