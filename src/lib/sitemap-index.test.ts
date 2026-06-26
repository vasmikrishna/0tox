// Unit tests for the apex sitemap-index builders.
// Run: pnpm test
import { test } from "node:test"
import assert from "node:assert/strict"
import { buildIndexEntries, buildSitemapIndexXml } from "./sitemap-index"
import type { IndexableTenant } from "./tenant"

function tenant(overrides: Partial<IndexableTenant> & { slug: string }): IndexableTenant {
  return {
    custom_domain: null,
    domain_verified: false,
    updated_at: null,
    ...overrides,
  }
}

const APEX = "https://site9.in"

test("apex sitemap.xml is always the first entry", () => {
  const entries = buildIndexEntries(APEX, [])
  assert.equal(entries.length, 1)
  assert.equal(entries[0].loc, "https://site9.in/sitemap.xml")
})

test("each indexable tenant maps to its subdomain sitemap", () => {
  const entries = buildIndexEntries(APEX, [
    tenant({ slug: "cafe-alpha" }),
    tenant({ slug: "nexoit" }),
  ])
  const locs = entries.map((e) => e.loc)
  assert.deepEqual(locs, [
    "https://site9.in/sitemap.xml",
    "https://cafe-alpha.site9.in/sitemap.xml",
    "https://nexoit.site9.in/sitemap.xml",
  ])
})

test("verified custom domain is used instead of the subdomain", () => {
  const entries = buildIndexEntries(APEX, [
    tenant({ slug: "vkreddy0", custom_domain: "app.vkreddy.com", domain_verified: true }),
  ])
  assert.equal(entries[1].loc, "https://app.vkreddy.com/sitemap.xml")
})

test("unverified custom domain falls back to the subdomain", () => {
  const entries = buildIndexEntries(APEX, [
    tenant({ slug: "soqall-in", custom_domain: "vkredy.com", domain_verified: false }),
  ])
  assert.equal(entries[1].loc, "https://soqall-in.site9.in/sitemap.xml")
})

test("the main-site tenant row is not listed twice", () => {
  const entries = buildIndexEntries(APEX, [
    tenant({ slug: "0tox" }),
    tenant({ slug: "nexoit" }),
  ])
  const locs = entries.map((e) => e.loc)
  assert.deepEqual(locs, [
    "https://site9.in/sitemap.xml",
    "https://nexoit.site9.in/sitemap.xml",
  ])
})

test("lastModified is emitted as <lastmod> when present", () => {
  const entries = buildIndexEntries(APEX, [
    tenant({ slug: "nexoit", updated_at: "2026-06-26T01:51:13.284Z" }),
  ])
  const xml = buildSitemapIndexXml(entries)
  assert.match(xml, /<lastmod>2026-06-26T01:51:13\.284Z<\/lastmod>/)
})

test("XML is a well-formed sitemap index", () => {
  const xml = buildSitemapIndexXml(buildIndexEntries(APEX, [tenant({ slug: "nexoit" })]))
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/)
  assert.match(xml, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/)
  assert.equal((xml.match(/<sitemap>/g) ?? []).length, 2)
  assert.equal((xml.match(/<loc>/g) ?? []).length, 2)
  assert.match(xml, /<\/sitemapindex>\s*$/)
})

test("special characters in loc are XML-escaped", () => {
  const xml = buildSitemapIndexXml([{ loc: "https://x.site9.in/sitemap.xml?a=1&b=2" }])
  assert.match(xml, /a=1&amp;b=2/)
  assert.doesNotMatch(xml, /a=1&b=2/)
})
