#!/usr/bin/env node
/**
 * Rewrite the CSP in the generated `_headers` with hashes for Nuxt's inline
 * scripts.
 *
 * Why this exists: `nuxt generate` emits one inline `<script>` per page that
 * assigns `window.__NUXT__.config`. Under `script-src 'self'` the browser refuses
 * to run it and the app boots without its runtime config — so a strict policy
 * silently breaks the site. The alternatives are worse:
 *
 * - `'unsafe-inline'` re-opens the exact hole the CSP exists to close.
 * - A hash committed by hand rots on the next build: the script embeds a
 *   per-build `buildId`, so its hash changes every time.
 *
 * So the hash is computed from the actual build output, which is the only source
 * that cannot disagree with what ships. Verify the result against the deployed
 * response; this script fails loudly rather than emitting a policy it cannot
 * justify.
 *
 * Scripts with `src` are covered by `'self'`. `type="application/json"` blocks
 * (Nuxt's payload) are data, never executed, so they need no hash.
 *
 * This app's CSP carries extra weight: the intro page promises that nothing
 * leaves the browser. `connect-src 'self'` is what makes that enforceable rather
 * than merely true, so the policy must not be weakened to 'unsafe-inline' for
 * convenience.
 */

import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const OUTPUT_DIR = '.output/public'
const HEADERS_FILE = join(OUTPUT_DIR, '_headers')

/** Inline <script> blocks: no src attribute, and not a JSON data block. */
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g

async function* walkHtml(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walkHtml(path)
    else if (entry.name.endsWith('.html')) yield path
  }
}

function isExecutable(attrs) {
  const type = /\btype=["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase()
  return !type || type === 'module' || type === 'text/javascript' || type === 'application/javascript'
}

const hashes = new Set()
let pageCount = 0

for await (const file of walkHtml(OUTPUT_DIR)) {
  pageCount += 1
  const html = await readFile(file, 'utf8')

  for (const [, attrs, body] of html.matchAll(INLINE_SCRIPT)) {
    if (!isExecutable(attrs) || body === '') continue
    // The hash is over the exact bytes between the tags, with no trimming —
    // that is what the browser hashes.
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`)
  }
}

if (pageCount === 0) {
  console.error(`[csp] No HTML found in ${OUTPUT_DIR}. Run \`nuxt generate\` first.`)
  process.exit(1)
}

let headers
try {
  headers = await readFile(HEADERS_FILE, 'utf8')
} catch {
  console.error(`[csp] ${HEADERS_FILE} is missing. It should be copied from public/_headers.`)
  console.error('[csp] Check that apps/web/public/_headers exists and is committed.')
  process.exit(1)
}

/**
 * Only real header lines are rewritten.
 *
 * `_headers` uses `#` for comments, and the comments in this project quote the
 * policy while explaining it. Replacing the first textual match rewrote a comment
 * and left the live policy untouched — a silent no-op that still looked like a
 * success. Matching `Content-Security-Policy:` on a non-comment line is the fix.
 */
const directive = hashes.size > 0 ? [...hashes].sort().join(' ') : ''
let rewritten = 0

const updated = headers
  .split('\n')
  .map((line) => {
    if (line.trimStart().startsWith('#')) return line
    if (!/^\s*Content-Security-Policy:/i.test(line)) return line
    if (!line.includes("script-src 'self'")) return line

    rewritten += 1
    return directive === ''
      ? line
      : line.replace("script-src 'self'", `script-src 'self' ${directive}`)
  })
  .join('\n')

if (rewritten === 0) {
  console.error(
    "[csp] No Content-Security-Policy line containing \"script-src 'self'\" was found in" +
      ' _headers. Refusing to ship a policy that would block Nuxt\'s inline config script.',
  )
  process.exit(1)
}

await writeFile(HEADERS_FILE, updated, 'utf8')

console.log(
  `[csp] ${pageCount} pages scanned, ${hashes.size} inline script hash(es) added to ${rewritten} policy line(s).`,
)
