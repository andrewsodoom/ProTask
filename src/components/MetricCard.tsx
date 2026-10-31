import { useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Target,
  TimerReset,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  YAxis,
} from 'recharts'
import type { Metric } from '../data/analytics'

const metricIcons = {
  tasks: CheckCircle2,
  hours: Clock3,
  accuracy: Target,
  cycle: TimerReset,
}

const numberFormat = (value: number, decimals: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)

function useCountUp(target: number, duration = 1100) {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [value, setValue] = useState(() => (reducedMotion ? target : 0))

  useEffect(() => {
    if (reducedMotion) return

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, reducedMotion])

  return value
}

type MetricCardProps = {
  metric: Metric
  index: number
}

export function MetricCard({ metric, index }: MetricCardProps) {
  const Icon = metricIcons[metric.icon]
  const decimals = metric.decimals ?? 0
  const animated = useCountUp(metric.value)
  const TrendIcon = metric.trend.direction === 'up' ? ArrowUpRight : ArrowDownRight
  const gradientId = `spark-${metric.id}`
  const sparkData = metric.spark.map((value, i) => ({ i, value }))

  return (
    <article
      className="fade-up group relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-5 backdrop-blur-xl transition duration-300 hover:border-accent/25 hover:shadow-[0_0_44px_-14px_rgba(34,211,238,0.45)]"
      style={{ animationDelay: `${80 + index * 70}ms` }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          {metric.label}
        </p>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface text-accent transition group-hover:border-accent/25 group-hover:bg-accent/10">
          <Icon size={15} strokeWidth={2} />
        </span>
      </div>

      <div className="mt-4 flex items-end gap-0.5">
        <span className="font-display text-[2rem] font-semibold leading-none tracking-tight text-ink tabular-nums">
          {numberFormat(animated, decimals)}
        </span>
        {metric.suffix && (
          <span className="mb-0.5 text-sm font-medium text-muted">{metric.suffix}</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px] ${
            metric.trend.positive
              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
              : 'border-rose-400/20 bg-rose-400/10 text-rose-300'
          }`}
        >
          <TrendIcon size={11} strokeWidth={2.5} />
          {metric.trend.value}
        </span>
        <span className="text-[11px] text-faint">{metric.hint}</span>
      </div>

      <div className="neon-chart -mx-1 mt-4 h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--accent)"
              strokeWidth={1.6}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
