---
name: Buyer push and preferences
description: Role separation rules for buyer account preferences and device notifications.
---

Buyer device notifications must stay scoped to buyer accounts and be delivered directly through Expo; never send buyer identity or push events through the investor-only signed callback. In-app notification category controls must remain separate from the device-push toggle. Persist buyer appearance, language, currency, and notification preferences through the authenticated user's profile metadata.

Buyer shipment logistics milestones are a separate timeline from order fulfilment status. Notify the buyer only when the logistics milestone actually changes; edits to timestamps or notes must not resend the same milestone alert.

**Why:** The signed notification callback is built around investor identity, while buyers use the same Laravel account service with separate role-specific screens and notification destinations.

**How to apply:** When changing buyer notifications or settings, check role-specific API access, preserve buyer-only push navigation, keep category muting in-app only, verify that logout revokes the current device token, and keep shipment logistics alerts separate from order fulfilment updates.
