---
name: e2e-setup-patterns
description: Use when writing or reviewing E2E test setup — cookie injection for tenant/app context, sidebar loading waits, skeleton waits, and known Playwright/React Query gotchas. Use when a test file needs beforeAll setup, or when a test is flaky due to timing or caching issues.
---

# E2E Setup Patterns

## Cookie injection (preferred)

Both Jotai atoms read from cookies on init. Injecting before `page.goto()` removes ~15-20 lines of flaky sidebar combobox interaction per test file.

```ts
test.beforeAll(async ({ workerContext }) => {
  page = await workerContext.newPage()
  await page.addInitScript(() => {
    // disable animations, set feature flags, etc.
  })
  await page.context().addCookies([
    { name: "tenantId", value: "2", url: "http://localhost:3000" },
    { name: "appId", value: "83", url: "http://localhost:3000" },
  ])
  await page.goto("/target-page")
  // tenant + app already selected — no sidebar interaction needed
})
```

**Rules:**
- Inject cookies **before** any `page.goto()` call
- Always use `url: "http://localhost:3000"` (dev server origin)
- Skip `page.goto("/")` + sidebar combobox clicks entirely after injection

## Sidebar loading wait (when cookie injection not possible)

The sidebar `Loader` renders `<nav data-hidden={!isLoading}>`:

```ts
await page.goto("/")
await expect(page.locator("nav[data-hidden=false]")).toBeVisible({ timeout: 10000 })
// safe to interact with sidebar comboboxes now
```

## Table data wait

Replace `waitForLoadState("networkidle")` — it's slow and unreliable:

```ts
await expect(page.getByTestId("skeleton-row")).toHaveCount(0)
```

## Selector preference

Never use role + label queries. Add `data-testid` to the source component and use `getByTestId`:

```ts
// ❌ Fragile
await page.getByRole("button", { name: "Delete" }).click()
await page.queryByRole("button", { name: "..." })

// ✅ Resilient
await page.getByTestId("delete-button").click()
await page.queryByTestId("delete-button")
```

## Known gotchas

### React Query caching breaks `waitForRequest()`

When a filter returns to its original value, React Query serves cached data without a new API request. `page.waitForRequest()` will time out.

Fix: for the "return to original" step, use `page.waitForTimeout(500)` + a UI assertion instead of `waitForRequest`.

### Re-render race on filter chips

Some filter buttons are derived from current table data. Clicking one can remove another chip from the DOM before you click it.

Fix: use `page.evaluate()` to click both in the same synchronous microtask before React re-renders.

```ts
await page.evaluate(() => {
  const chipA = document.querySelector('[data-testid="chip-a"]') as HTMLElement
  const chipB = document.querySelector('[data-testid="chip-b"]') as HTMLElement
  chipA?.click()
  chipB?.click()
})
```

### Graceful skip is a feature

When filter has no matching data in the test environment, skip — never hard-fail:

```ts
if (await allCells.count() === 0) {
  test.skip(true, "No matching data in test environment")
  return
}
```

This distinguishes "data missing" from "feature broken".
