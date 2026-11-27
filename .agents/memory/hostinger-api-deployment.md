---
name: Hostinger API deployment
description: Production hosting and access requirements for the OG Exports Laravel API.
---

The OG Exports production Laravel API is hosted on Hostinger Business. Deployments there are separate from Replit publishing and require SSH access authorized in Hostinger.

**Why:** The mobile app calls the Hostinger API domain directly, so publishing the Replit workspace cannot update server routes or migrations.

**How to apply:** For production Laravel changes, use the supplied backend source and deploy to Hostinger only after a valid SSH key is authorized. Never replace the production `.env`; apply required migrations after deploying code.

In this workspace, HTTPS access to `GIT_URL` only provides repository access; there is no checked-in Hostinger auto-deployment workflow. The workspace FTPS route was unreachable, so a successful Git read or push must not be treated as a production deployment.

**Why:** Auto-invest deployment attempts confirmed that source control access and Hostinger runtime access are separate, and the feature requires running its Laravel migration as well as uploading code.

**How to apply:** If SSH is unavailable, confirm an actual Hostinger deployment mechanism and command path before changing production. Do not upload only the Laravel files while leaving their migration unapplied.

**Why:** The configured Hostinger SSH port and username may include human-readable labels, which OpenSSH cannot use as-is.

**How to apply:** Normalize the port to digits and remove a leading `Username: ` before connecting. Validate the private key without printing it; keep temporary key files outside the workspace and delete them afterward.

Do not trust a newly scanned SSH host key until its fingerprint has been confirmed against Hostinger's authoritative host-key information.

**Why:** A private-key login does not by itself prove that the remote SSH server is the intended Hostinger host.

**How to apply:** If no trusted `known_hosts` entry exists, obtain the SSH fingerprint without uploading files, have it confirmed first, then pin the verified key for the deployment connection.

For nonstandard SSH ports, `ssh-keyscan` may print comment lines before the actual public-key row, and SSH may verify the resolved IP as well as the hostname.

**Why:** Parsing the first scan line can create a malformed host-key entry that strict checking correctly rejects.

**How to apply:** Select the row whose key type is `ssh-ed25519`, compare its `ssh-keygen -lf` fingerprint to the user-confirmed value, and pin both `[hostname]:port` and `[resolved-IP]:port` when applicable.

**Why:** Hostinger's browser-terminal instructions apply to its newer File Manager; older File Manager layouts may have no terminal control.

**How to apply:** If the toolbar lacks both a Terminal control and the newer Deploy control, stop searching the file list and use SSH Access or another confirmed deployment method instead.

**Why:** Copying a multiline private key through the secret form did not preserve a usable key; a verified one-line Base64 value did.

**How to apply:** Store the encoded key only as the `HOSTINGER_SSH_PRIVATE_KEY_B64` Replit Secret, decode it to a mode-600 temporary file for SSH, and never print or commit either representation.

Production Laravel files can differ from the local checkout even when their relevant method still matches.

**Why:** Replacing a whole production controller or route file can erase production-only changes.

**How to apply:** Compare the remote code first, then use guarded, single-occurrence edits with remote backups. Run Artisan cache commands separately over SSH; redirect `route:clear` output before parsing `route:list --json`.

Before deploying buyer dashboard metrics that depend on order-item pricing snapshots, compare Hostinger's migration state and verify the backing columns exist. Schema-gate optional metrics so an older production schema cannot fail the whole dashboard.

**Why:** On 2026-11-26, Hostinger lacked `order_items.discount_amount` while the deployed dashboard query assumed it existed, causing dashboard requests to return 500.

**How to apply:** Check migration state and required columns before shipping database-dependent queries. If an optional metric's migration is not applied, return it as unavailable instead of aborting the endpoint.

When production is behind the local checkout, deploy only the ordered migrations directly required by the approved feature. Confirm each target column is absent first; do not run every pending migration or backfill historical prices from the current catalogue.

**Why:** Hostinger can lag the workspace in both source and schema, so an all-pending migration run may include unrelated changes and current catalogue prices are not reliable historical evidence.

**How to apply:** Compare live source and schema, preserve production-only edits with guarded patches and backups, then apply just the required additive migrations and verify their status and columns.
