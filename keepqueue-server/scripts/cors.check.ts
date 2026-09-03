/**
 * Self-check for the CORS origin rules. Pure functions, no Firebase, no credentials.
 *
 *   cd keepqueue-server && npm run check:cors
 */
import assert from "node:assert/strict";
import { allowedOrigins, isAllowedOrigin, vercelPreviewPattern } from "../src/helpers/cors";

const SCOPE = "keepqueueteam";
const defaults = allowedOrigins();

// Production and local development keep working.
assert.equal(isAllowedOrigin("https://keepqueue.com", defaults), true);
assert.equal(isAllowedOrigin("https://www.keepqueue.com", defaults), true);
assert.equal(isAllowedOrigin("http://localhost:3000", defaults), true);

// Server-to-server and curl send no Origin at all; CORS only governs browsers.
assert.equal(isAllowedOrigin(undefined, defaults), true);

// An unrelated site is refused.
assert.equal(isAllowedOrigin("https://evil.com", defaults), false);

// Without a configured scope there are no preview origins, rather than a wildcard.
assert.equal(vercelPreviewPattern(undefined), null);
assert.equal(isAllowedOrigin("https://keepqueue-anything.vercel.app", defaults), false);

// With a scope, our own previews are admitted...
assert.equal(isAllowedOrigin(`https://keepqueue-abc123-${SCOPE}.vercel.app`, defaults, SCOPE), true);
assert.equal(isAllowedOrigin(`https://keepqueue-git-main-${SCOPE}.vercel.app`, defaults, SCOPE), true);

// ...and a project anyone could create under a different account is not. This is the case the
// old /^https:\/\/keepqueue-[a-z0-9-]+\.vercel\.app$/ pattern let through.
assert.equal(isAllowedOrigin("https://keepqueue-evil-attackerteam.vercel.app", defaults, SCOPE), false);
assert.equal(isAllowedOrigin("https://keepqueue-evil.vercel.app", defaults, SCOPE), false);

// The dots are escaped, so no other host can impersonate the preview domain.
assert.equal(isAllowedOrigin(`https://x-${SCOPE}Xvercel.app`, defaults, SCOPE), false);
assert.equal(isAllowedOrigin(`https://x-${SCOPE}.vercel.app.evil.com`, defaults, SCOPE), false);

// An explicit list replaces the defaults rather than adding to them — the behaviour
// .env.example documents.
const explicit = allowedOrigins("https://staging.keepqueue.com");
assert.deepEqual(explicit, ["https://staging.keepqueue.com"]);
assert.equal(isAllowedOrigin("https://keepqueue.com", explicit), false);

console.log("cors rules: all checks passed");
