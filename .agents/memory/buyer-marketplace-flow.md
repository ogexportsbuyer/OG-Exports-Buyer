---
name: Buyer marketplace flow
description: Product discovery and account navigation expectations for the OG Exports mobile app.
---

The OG Exports mobile app is buyer-only. Guests can browse the public catalogue; cart, account, and order actions require buyer sign-in or registration. Registration has no account-type choice or investor-signup link, and the server must always assign new registrations the buyer role. Email verification remains required; after verification, establish the session and take the user directly to the requested buyer route without a separate login. Investor-only sessions/routes must not enter the buyer app. Do not delete investor accounts or data.

**Why:** The user specified that the complete mobile app is for buyers only and that successful registration should proceed into the app instead of returning to sign-in.

**How to apply:** Use the existing Laravel product, cart, quotation, and order APIs. Keep the catalogue public, enforce buyer-only actions with backend role protection, and do not replace real catalogue data with mock products.

The Replit browser preview cannot read the production catalogue because the API does not allow that preview origin via CORS, although the public catalogue endpoints respond successfully to direct requests.

**Why:** Browser preview requests are subject to CORS; native iOS and Android requests are not.

**How to apply:** Treat browser-preview CORS errors as a preview limitation, not proof that native requests fail. Verify the API endpoints directly and test the flow in Expo Go or an installed build.

Use premium gold for buyer-app foreground accents such as text, icons and outlines. Keep the existing gold/teal page washes and tinted surfaces unchanged. Preserve the dark-teal primary buttons and distinct financial/status colors.

**Why:** the user changed the buyer foreground accent request from orange back to premium gold.

**How to apply:** Use a contrast-safe gold on foreground elements while leaving background/surface tokens, the official logo, and semantic status colors unchanged.

The buyer home should follow the user's marketplace reference: a centered swipeable product slide with neighboring-card peeks and real catalog thumbnails, origin chips, recommendations, then a two-column image-led product grid. Do not invent offers, prices, or supplier metrics.

**Why:** the user asked for the same top slider presentation and product cards below it.

**How to apply:** Build the home from live catalog data and keep the reference's visual hierarchy without copying another marketplace's brand or fabricating content.

An FOB order must not be placed when any cart item has no positive, confirmed price; guide the buyer to request a quotation instead.

**Why:** The backend treats a missing product price as zero, which could otherwise create a confirmed zero-value order.

**How to apply:** Keep the FOB order path blocked until every line has a price, while leaving non-FOB quotation requests available.
