/// <reference types="node" />
import assert from "node:assert/strict"
import { parseExchangeRates, safeNodes, type Node } from "./api.ts"

const node = { id: 1, metrics: { uptime: 100, cpu: 1, load: [0.1, 0.2, 0.3],
  mem_total: 1024, mem_used: 512, swap_total: 0, swap_used: 0, disk_total: 2048, disk_used: 1024,
  net_rx: 10, net_tx: 20, total_rx: 100, total_tx: 200, month_rx: 50, month_tx: 100,
  tcp: 3, udp: 4, procs: 20 } } as Node
assert.equal(safeNodes([node])[0], node)
for (const patch of [{ load: null }, { load: [1, "bad", 3] }, { cpu: "bad" }, { net_rx: Infinity }]) {
  const bad = { ...node, metrics: { ...node.metrics, ...patch } } as unknown as Node
  const result = safeNodes([bad, node])
  assert.equal(result[0].metrics, null)
  assert.equal(result[1], node)
}
const parsed = parseExchangeRates({
  base: "CNY",
  date: "2026-09-17",
  rates: { USD: 0.2, EUR: 0.1, GBP: 0.05, JPY: 20 },
})
assert.deepEqual(parsed?.rates, { CNY: 1, USD: 5, EUR: 10, GBP: 20, JPY: 0.05 })
assert.equal(parseExchangeRates({ base: "CNY", date: "2026-09-17", rates: { USD: 0.2 } }), null)
console.log("invalid live reports and exchange rates are isolated")
