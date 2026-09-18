import assert from "node:assert/strict"

import { calculateFinance, remainingDays, toCny, AVERAGE_DAYS_PER_MONTH } from "./finance.ts"

const rates = {
  base: "CNY" as const,
  date: "2026-09-17",
  rates: { CNY: 1, USD: 7, EUR: 8, GBP: 9, JPY: 0.05 },
}
const now = new Date(2026, 8, 18).getTime()
const nodes = [
  { price: 120, currency: "CNY", billing_cycle: "monthly", expires_at: "2026-10-18" },
  { price: 30, currency: "USD", billing_cycle: "quarterly", expires_at: "2026-11-17" },
  { price: 100, currency: "EUR", billing_cycle: "once", expires_at: null },
]

assert.equal(toCny(30, "USD", rates), 210)
assert.equal(toCny(30, "USD", null), null)
assert.equal(remainingDays("2026-10-18", now), 30)
assert.equal(remainingDays("2026-09-01", now), 0)

const summary = calculateFinance(nodes, rates, now)
assert.equal(summary.total, 1130)
assert.equal(summary.monthly, 190)
assert.ok(Math.abs(summary.remaining! - (120 * 30 + 70 * 60) / AVERAGE_DAYS_PER_MONTH) < 0.000001)

const incomplete = calculateFinance(
  [{ price: 10, currency: "USD", billing_cycle: "monthly", expires_at: "2026-10-18" }],
  null,
  now,
)
assert.deepEqual(incomplete, { total: null, monthly: null, remaining: null })

console.log("finance calculation passed")
