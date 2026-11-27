---
name: Buyer marketplace flow
description: Product discovery and account navigation expectations for the OG Exports mobile app.
---

The OG Exports mobile app is buyer-only. Guests can browse the public catalogue, build a cart, and prepare RFQ or checkout details. Ask them to sign in or register only when they submit an RFQ, request a quotation, or place an order; preserve their draft and resume it after authentication. Keep buyer profiles, RFQ/order history, and other account data behind authentication. Registration has no account-type choice or investor-signup link, and the server must always assign new registrations the buyer role. Email verification remains required; after verification, establish the session and take the user directly to the requested buyer route without a separate login. Investor-only sessions/routes must not enter the buyer app. Do not delete investor accounts or data.

**Why:** The user specified that onboarding must lead to the buyer homepage and that authentication should happen at the final transaction action, with drafts kept through sign-in or registration.

**How to apply:** Use persistent local guest-cart and form drafts, merge guest quantities idempotently into the authenticated cart, and resume the exact RFQ/order action after account verification. Use existing Laravel APIs, enforce buyer-only submissions server-side, and do not replace real catalogue data with mock products.

Keep cart and other non-tab buyer destinations, including Orders & quotations, as root-stack routes rather than untriggered routes inside the native tab group. Shortcuts should navigate to their canonical root routes.

**Why:** Expo SDK 58 NativeTabs cannot navigate to hidden triggers, and an untriggered route inside the tab group can fall back to the default Home tab.

**How to apply:** When adding buyer routes without a bottom-tab item, register them in the root Stack and keep the route file outside `(buyer-tabs)`.

Country selection throughout the buyer journey should use a searchable bottom sheet rather than free-text inputs or inline chips. Checkout destinations must remain limited to countries with available ports.

**Why:** The user requested the same upward country selector anywhere a country must be selected, matching the RFQ flow.

**How to apply:** Use the existing bottom-sheet country pickers for buyer profile and company fields; use the RFQ-style picker for API-backed checkout destinations, preserving country IDs and port filtering.

The Replit browser preview cannot read the production catalogue because the API does not allow that preview origin via CORS, although the public catalogue endpoints respond successfully to direct requests.

**Why:** Browser preview requests are subject to CORS; native iOS and Android requests are not.

**How to apply:** Treat browser-preview CORS errors as a preview limitation, not proof that native requests fail. Verify the API endpoints directly and test the flow in Expo Go or an installed build.

Use premium gold for buyer-app foreground accents such as text, icons and outlines. Keep the existing gold/teal page washes and tinted surfaces unchanged. Preserve the dark-teal primary buttons and distinct financial/status colors.

**Why:** the user changed the buyer foreground accent request from orange back to premium gold.

**How to apply:** Use a contrast-safe gold on foreground elements while leaving background/surface tokens, the official logo, and semantic status colors unchanged.

The buyer home should follow the user's marketplace reference: a centered swipeable product slide with neighboring-card peeks and real catalog thumbnails, origin chips, recommendations, then a two-column image-led product grid. Do not invent offers, prices, or supplier metrics.

**Why:** the user asked for the same top slider presentation and product cards below it.

**How to apply:** Build the home from live catalog data and keep the reference's visual hierarchy without copying another marketplace's brand or fabricating content.

Whenever the buyer app displays a real product price, identify its FOB basis alongside the amount across catalog cards, product details, cart and checkout summaries.

**Why:** The user explicitly asked for `FOB` to appear with product prices on the homepage and anywhere else they are shown.

**How to apply:** Keep the shared FOB formatter for product and cart price displays; leave quote-only products as “Request a quote” rather than showing a fabricated amount.

An FOB order must not be placed when any cart item has no positive, confirmed price; guide the buyer to request a quotation instead.

**Why:** The backend treats a missing product price as zero, which could otherwise create a confirmed zero-value order.

**How to apply:** Keep the FOB order path blocked until every line has a price, while leaving non-FOB quotation requests available.

Buyer dashboard savings include recorded checkout discounts and confirmed quotation savings. Quote savings compare the accepted FOB unit price with the product card's displayed FOB unit price saved when the RFQ was submitted; aggregate percentage is weighted by saved reference product value. Exclude cancelled orders and never estimate legacy deals without snapshots.

**Why:** The user asked for accepted quotation deals to automatically contribute their discount amount and percentage using the price shown on the product card.

**How to apply:** Snapshot the server-calculated buyer-discounted FOB price on product-linked RFQs, persist the comparison and negotiated discount on the confirmed order line, and keep legacy records without a snapshot out of the percentage estimate.

Buyer catalogue photos should load from their API/CDN URLs rather than being bundled into the app. Normalize relative paths to the configured API origin and use memory/disk caching for repeat views.

**Why:** The user asked for product photos to stay URL-based so the app package remains light and product screens feel faster.

**How to apply:** Use the shared cached remote-image component across home, catalogue, detail gallery, and cart. Keep real API images; do not replace missing photos with invented product art.

Tapping a Buyer product card's image or product information opens its details; favorite and cart controls remain independent actions.

**Why:** The user asked that tapping a product card open its detail page, not only the explicit Details button.

**How to apply:** Apply this behavior to shared Buyer product cards and preserve separate, accessible favorite and cart controls.
