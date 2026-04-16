---
name: e2e-table-filter
description: Use when adding E2E validation that a filter actually affects table row data — not just that the API fires. Use when a filter has no table-cell assertion, or when a new filter is implemented and needs data-level test coverage.
---

# Filter Table E2E Validation

## Overview
Validates that applying a filter changes the visible table rows, not just that an API request fires. Requires a `data-testid` + data attribute on the table cell, then asserts all visible rows match the filter value.

## Process

### 1. Find the filter component
- Locate the filter in `components/filters/`
- Identify what value/field it sends to the API

### 2. Find the table cell
- Locate the cell in `data-table/index.tsx`
- Check if `data-testid` and a data attribute exist
- If missing, add both:

```tsx
<TableCell
  data-testid="table-cell-{field}"
  data-{field}={player.field_name}
>
```

**If unsure which field maps to the filter — ask, do not presume.**

### 3. Add validation tests
Two patterns depending on filter type:

**Toggle filter** (null / true / false cycle — e.g. `include-disabled`, `with-comments`):
```ts
test("toggle: filter=true — all rows match", async () => {
  await reset()
  const btn = page.getByTestId("filter-{name}")

  const req = waitForApiRequest()
  await btn.click()  // null → true
  await req

  await expect(page.getByTestId("skeleton-row")).toHaveCount(0)

  const allCells = page.locator('[data-testid="table-cell-{field}"]')
  if (await allCells.count() === 0) {
    test.skip(true, "No matching data in test environment")
    return
  }

  const nonMatchingCells = page.locator('[data-testid="table-cell-{field}"][data-{field}="false"]')
  await expect(nonMatchingCells).toHaveCount(0)

  await reset()
})
```

**Value filter** (select/input — e.g. country, status):
```ts
for (const value of ["US", "CN", "VN"]) {
  test(`filter by ${value} — all rows match`, async () => {
    await reset()

    const reqPromise = waitForApiRequest()
    await page.getByTestId("filter-{name}").click()
    const option = page.getByRole("option", { name: value })
    if (!(await option.isVisible().catch(() => false))) {
      test.skip(true, `"${value}" not available in dropdown`)
      return
    }
    await option.click()
    await reqPromise

    await expect(page.getByTestId("skeleton-row")).toHaveCount(0)

    const allCells = page.locator('[data-testid="table-cell-{field}"]')
    if (await allCells.count() === 0) {
      test.skip(true, "No data for this value in test environment")
      return
    }

    const nonMatchingCells = page.locator(`[data-testid="table-cell-{field}"]:not([data-{field}="${value}"])`)
    await expect(nonMatchingCells).toHaveCount(0)

    await reset()
  })
}
```

## Rules
- Always wait for `skeleton-row` count 0 before asserting cells
- Always graceful-skip when no data — never hard-fail on missing test data
- Use `:not([data-attr="value"])` to assert no non-matching cells rather than checking each cell individually
- **Ask if the mapping between filter value and cell data attribute is unclear — do not presume**
