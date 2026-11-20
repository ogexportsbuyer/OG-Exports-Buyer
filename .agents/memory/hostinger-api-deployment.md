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

**Why:** Hostinger's browser-terminal instructions apply to its newer File Manager; older File Manager layouts may have no terminal control.

**How to apply:** If the toolbar lacks both a Terminal control and the newer Deploy control, stop searching the file list and use SSH Access or another confirmed deployment method instead.

**Why:** Copying a multiline private key through the secret form did not preserve a usable key; a verified one-line Base64 value did.

**How to apply:** Store the encoded key only as the `HOSTINGER_SSH_PRIVATE_KEY_B64` Replit Secret, decode it to a mode-600 temporary file for SSH, and never print or commit either representation.

Production Laravel files can differ from the local checkout even when their relevant method still matches.

**Why:** Replacing a whole production controller or route file can erase production-only changes.

**How to apply:** Compare the remote code first, then use guarded, single-occurrence edits with remote backups. Run Artisan cache commands separately over SSH; redirect `route:clear` output before parsing `route:list --json`.
