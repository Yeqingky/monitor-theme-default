import { ArrowDown, ArrowDownUp, ArrowUp, Coins, Gauge, Server } from "lucide-react"

import { Card } from "@/components/ui/card"
import { speedHistory, type ExchangeRates, type Node } from "@/lib/api"
import { calculateFinance } from "@/lib/finance"
import { bytes, cny, rate } from "@/lib/format"
import { cn } from "@/lib/utils"

function Tile({ icon: Icon, label, children }: {
  icon: typeof Server; label: string; children: React.ReactNode
}) {
  return (
    <Card className="gap-0 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      {children}
    </Card>
  )
}

const RATE_CODES = ["USD", "EUR", "GBP", "JPY"] as const

function FinanceMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="tnum mt-1 truncate text-sm font-semibold">{value === null ? "—" : cny(value)}</div>
    </div>
  )
}

function RateList({ rates }: { rates: ExchangeRates | null }) {
  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>今日汇率</span>
        <span className="tnum">CNY</span>
      </div>
      <div className="tnum mt-2 grid grid-cols-2 gap-x-5 gap-y-1.5 text-xs">
        {RATE_CODES.map((code) => {
          const value = rates?.rates[code]
          return (
            <div key={code} className="flex min-w-0 items-center justify-between gap-2">
              <span className="text-muted-foreground">{code}</span>
              <span className="truncate">{typeof value === "number" && Number.isFinite(value) ? `¥${value.toFixed(6)}` : "—"}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ValueTile({ nodes, rates }: { nodes: Node[]; rates: ExchangeRates | null }) {
  const finance = calculateFinance(nodes, rates)

  return (
    <div className="group relative z-20 min-w-0">
      <Card
        tabIndex={0}
        role="button"
        aria-label="查看剩余价值明细"
        className="h-full cursor-default gap-0 p-3 outline-offset-2"
      >
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Coins className="size-3.5" />
          剩余价值
        </div>
        <div className="tnum mt-1 text-xl font-semibold">
          {finance.remaining === null ? "—" : cny(finance.remaining)}
          {finance.remaining !== null && <span className="ml-1 text-xs font-normal text-muted-foreground">CNY</span>}
        </div>
        <div className="mt-auto truncate pt-1 text-xs text-muted-foreground">悬停查看明细</div>
      </Card>

      <div className="pointer-events-none invisible absolute left-1/2 top-full z-50 mt-2 w-[min(25rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border bg-popover p-4 text-popover-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
        <div className="grid grid-cols-3 gap-3">
          <FinanceMetric label="每年支出" value={finance.annual} />
          <FinanceMetric label="每月支出" value={finance.monthly} />
          <FinanceMetric label="剩余价值" value={finance.remaining} />
        </div>
        <RateList rates={rates} />
      </div>
    </div>
  )
}

/**
 * Up then down, side by side: the form every traffic figure on this page takes,
 * and the order the arrows are read in. Stacked below sm, where two tiles share
 * a phone's width and "23.3 MB" has roughly 70px available.
 */
function Flow({ up, down, className }: { up: string; down: string; className?: string }) {
  return (
    <div className={cn("tnum grid grid-cols-1 gap-x-2 sm:grid-cols-2", className)}>
      <span className="inline-flex items-center gap-1">
        <ArrowUp className="size-3 shrink-0 text-muted-foreground" />
        {up}
      </span>
      <span className="inline-flex items-center gap-1">
        <ArrowDown className="size-3 shrink-0 text-muted-foreground" />
        {down}
      </span>
    </div>
  )
}

/**
 * A bare polyline with no axes or tooltips: at this size only the shape is
 * legible, and recharts would bring a full chart's machinery for it. Series share
 * one scale so the two throughput lines remain comparable.
 */
function Spark({ series }: { series: { values: number[]; className: string }[] }) {
  const top = Math.max(...series.flatMap((s) => s.values), 1)
  const width = Math.max(...series.map((s) => s.values.length), 2) - 1
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-7 w-full" aria-hidden>
      {series.map((s, i) => (
        <polyline
          key={i}
          className={s.className}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
          points={s.values.map((v, x) => `${(x / width) * 100},${23 - (v / top) * 22}`).join(" ")}
        />
      ))}
    </svg>
  )
}

export function Summary({ nodes, rates = null }: { nodes: Node[]; rates?: ExchangeRates | null }) {
  const online = nodes.filter((n) => n.online)
  const sum = (pick: (n: Node) => number) => nodes.reduce((total, n) => total + pick(n), 0)

  // The same push produced `nodes` and this sample, so the figure above the line
  // is that line's last point.
  const now = speedHistory.at(-1) ?? { rx: 0, tx: 0 }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile icon={Server} label="节点">
        <div className="tnum mt-1 text-xl font-semibold">
          {online.length} / {nodes.length}
        </div>
        <div className="mt-auto pt-1 text-xs text-muted-foreground">
          {nodes.length - online.length > 0 ? `${nodes.length - online.length} 个离线` : "全部在线"}
        </div>
      </Tile>

      <ValueTile nodes={nodes} rates={rates} />

      <Tile icon={ArrowDownUp} label="今日流量">
        <Flow
          up={bytes(sum((n) => n.day_tx))}
          down={bytes(sum((n) => n.day_rx))}
          className="mt-1 text-sm font-semibold"
        />
        <div className="mt-2 text-xs text-muted-foreground">总流量</div>
        <Flow up={bytes(sum((n) => n.total_tx))} down={bytes(sum((n) => n.total_rx))} className="mt-0.5 text-sm" />
      </Tile>

      <Tile icon={Gauge} label="实时网速">
        <Flow up={rate(now.tx)} down={rate(now.rx)} className="mt-1 text-sm font-semibold" />
        <div className="mt-auto pt-1">
          {/* The first line carries the shade the figure above it is read in,
              so up is drawn over down. */}
          <Spark
            series={[
              { values: speedHistory.map((s) => s.tx), className: "text-foreground" },
              { values: speedHistory.map((s) => s.rx), className: "text-muted-foreground" },
            ]}
          />
        </div>
      </Tile>
    </div>
  )
}
