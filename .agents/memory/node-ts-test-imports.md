---
name: Node TypeScript test imports
description: Native Node test-runner import resolution for TypeScript utilities in the mobile package.
---

For `.mjs` tests run with Node's native test runner, direct `.ts` test imports work, but extensionless sibling imports and TypeScript path aliases can fail at runtime. In the mobile package, explicit `.ts` imports work when `allowImportingTsExtensions` is enabled alongside `noEmit`.

**Why:** The currency-display tests exercised both native Node resolution and the Expo package's TypeScript check; using incompatible resolution styles caused one check to fail at a time.

**How to apply:** Keep utilities imported by native Node tests dependency-light and directly loadable. Use explicit relative `.ts` imports for Node-loaded TypeScript modules when the package uses `noEmit` and enables `allowImportingTsExtensions`; avoid app path aliases in that module graph.
