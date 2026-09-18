import type { ExchangeRates, Node } from "@/lib/api"

/** Average calendar days in one month, used only to prorate remaining value. */
export const AVERAGE_DAYS_PER_MONTH = 365.2425 / 12

const CYCLE_MONTHS: Record<string, number | null> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  yearly: 12,
  biennial: 24,
  triennial: 36,
  once: null,
}

export type FinanceSummary = {
  total: number | null
  monthly: number | null
  remaining: number | null
}

function validAmount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

/** Convert a provider price with a CNY-per-unit rate into CNY. */
export function toCny(amount: number, currency: string, rates: ExchangeRates | null): number | null {
  const value = validAmount(amount)
  if (!value) return 0
  const code = currency.trim().toUpperCase()
  const rate = code === "CNY" ? 1 : rates?.rates[code]
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0 ? value * rate : null
}

/** Whole days left before the configured date, clamped after expiry. */
export function remainingDays(date: string | null, now = Date.now()): number | null {
  if (!date) return null
  const target = new Date(`${date}T00:00:00`).getTime()
  if (Number.isNaN(target)) return null
  return Math.max(0, Math.ceil((target - now) / 86_400_000))
}

/**
 * Calculate the fleet's actual paid value, monthly spend and remaining value.
 * A missing exchange rate or expiry date makes only the affected aggregate
 * unavailable instead of silently presenting a partial total.
 */
export function calculateFinance(nodes: Pick<Node, "price" | "currency" | "billing_cycle" | "expires_at">[], rates: ExchangeRates | null, now = Date.now()): FinanceSummary {
  let total = 0
  let monthly = 0
  let remaining = 0
  let totalComplete = true
  let monthlyComplete = true
  let remainingComplete = true

  for (const node of nodes) {
    const price = validAmount(node.price)
    if (!price) continue

    const value = toCny(price, node.currency, rates)
    if (value === null) {
      totalComplete = false
      monthlyComplete = false
      remainingComplete = false
      continue
    }
    total += value

    const months = CYCLE_MONTHS[node.billing_cycle]
    if (months === undefined) {
      monthlyComplete = false
      remainingComplete = false
      continue
    }
    // One-off purchases are part of total value only.
    if (months === null) continue

    const monthlyValue = value / months
    monthly += monthlyValue
    const days = remainingDays(node.expires_at, now)
    if (days === null) {
      remainingComplete = false
    } else {
      remaining += monthlyValue * days / AVERAGE_DAYS_PER_MONTH
    }
  }

  return {
    total: totalComplete ? total : null,
    monthly: monthlyComplete ? monthly : null,
    remaining: totalComplete && monthlyComplete && remainingComplete ? remaining : null,
  }
}
