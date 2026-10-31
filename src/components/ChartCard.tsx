import type { CSSProperties } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartPoint, RangeWeeks } from '../data/analytics'

type ChartTooltipProps = {
  active?: boolean
  label?: string
  payload?: ReadonlyArray<{ dataKey?: string | number; value?: number }>
  accent: string
  unit: string
}

function ChartTooltip({ active, label, payload, accent, unit }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const current = payload.find((item) => item.dataKey === 'value')
  const previous = payload.find((item) => item.dataKey === 'prev')

  return (
    <div className="rounded-xl border border-line bg-panel/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-faint">
        Week of {label}
      </p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-6 text-xs">
          <span className="flex items-center gap-1.5 text-muted">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
            />
            This period
          </span>
          <span className="font-mono text-ink">
            {current?.value ?? 0}
            {unit === 'h' ? 'h' : ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6 text-xs">
          <span className="flex items-center gap-1.5 text-faint">
            <span className="size-1.5 rounded-full bg-faint" />
            Previous
          </span>
          <span className="font-mono text-muted">
            {previous?.value ?? 0}
            {unit === 'h' ? 'h' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

type ChartCardProps = {
  title: string
  subtitle: string
  data: ChartPoint[]
  range: RangeWeeks
  accent: string
  accentRgb: string
  gradientId: string
  unit: string
}

export function ChartCard({
  title,
  subtitle,
  data,
  range,
  accent,
  accentRgb,
  gradientId,
  unit,
}: ChartCardProps) {
  const total = data.reduce((sum, point) => sum + point.value, 0)
  const previousTotal = data.reduce((sum, point) => sum + point.prev, 0)
  const delta = previousTotal === 0 ? 0 : ((total - previousTotal) / previousTotal) * 100
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`

  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-panel/60 p-5 backdrop-blur-xl transition duration-300 hover:border-accent/20 sm:p-6">
      <div
        className="pointer-events-none absolute -right-24 -top-28 size-64 rounded-full opacity-40 blur-3xl"
        style={{ backgroundColor: accent }}
      />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
            />
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">
              {title}
            </h3>
          </div>
          <p className="mt-1 text-xs text-faint">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.12em] text-faint">
          <span className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-4 rounded-full"
              style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
            />
            This period
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t border-dashed border-faint" />
            Previous
          </span>
        </div>
      </div>

      <div
        className="neon-chart relative mt-6 h-[250px] w-full sm:h-[270px]"
        style={{ '--neon': accentRgb } as CSSProperties}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 22, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
                <stop offset="55%" stopColor={accent} stopOpacity={0.08} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 7"
              vertical={false}
              stroke="var(--chart-grid)"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              minTickGap={26}
              tick={{ fill: 'var(--chart-tick)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={44}
              allowDecimals={false}
              tick={{ fill: 'var(--chart-tick-2)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
            />
            <Tooltip
              cursor={{ stroke: accent, strokeOpacity: 0.22, strokeDasharray: '4 5' }}
              content={<ChartTooltip accent={accent} unit={unit} />}
            />
            <Line
              type="monotone"
              dataKey="prev"
              stroke="var(--chart-prev)"
              strokeWidth={1.4}
              strokeDasharray="5 6"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={accent}
              strokeWidth={2.2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 4,
                fill: 'var(--canvas)',
                stroke: accent,
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 border-t border-line pt-4">
        <div>
          <p className="font-mono text-lg font-medium text-ink tabular-nums">
            {total.toLocaleString('en-US')}
            {unit === 'h' ? 'h' : ''}
          </p>
          <p className="text-[11px] text-faint">
            {unit === 'h' ? 'hours' : 'tasks'} in the last {range} weeks
          </p>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] ${
              delta >= 0
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                : 'border-rose-400/20 bg-rose-400/10 text-rose-300'
            }`}
          >
            {deltaLabel}
          </span>
          <p className="mt-1 text-[11px] text-faint">
            prev {previousTotal.toLocaleString('en-US')}
            {unit === 'h' ? 'h' : ''}
          </p>
        </div>
      </div>
    </section>
  )
}
