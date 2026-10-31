import { useState } from 'react'
import { ChartCard } from './ChartCard'
import { useTheme } from '../context/ThemeContext'
import { CHART_RANGES } from '../data/analytics'
import type { ChartPoint, RangeWeeks } from '../data/analytics'

type MomentumSectionProps = {
  throughput: ChartPoint[]
  hours: ChartPoint[]
}

export function MomentumSection({ throughput, hours }: MomentumSectionProps) {
  const [range, setRange] = useState<RangeWeeks>(12)
  const { theme } = useTheme()
  const light = theme === 'light'

  return (
    <section className="mt-8" aria-labelledby="momentum-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="momentum-heading"
            className="font-display text-lg font-semibold tracking-tight text-ink"
          >
            Momentum
          </h2>
          <p className="mt-1 text-sm text-muted">
            Throughput and deep-work hours against the previous period.
          </p>
        </div>

        <div
          className="inline-flex items-center gap-0.5 rounded-xl border border-line bg-surface p-0.5"
          role="group"
          aria-label="Chart range"
        >
          {CHART_RANGES.map((weeks) => {
            const active = range === weeks
            return (
              <button
                key={weeks}
                type="button"
                onClick={() => setRange(weeks)}
                aria-pressed={active}
                className={`rounded-[10px] px-3 py-1.5 font-mono text-[11px] transition ${
                  active
                    ? 'bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgba(34,211,238,0.3)]'
                    : 'text-faint hover:text-ink-soft'
                }`}
              >
                {weeks}W
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Throughput"
          subtitle="Tasks completed per week"
          data={throughput.slice(-range)}
          range={range}
          accent={light ? '#0891b2' : '#22d3ee'}
          accentRgb={light ? '8 145 178' : '34 211 238'}
          gradientId="throughput-fill"
          unit="tasks"
        />
        <ChartCard
          title="Study hours"
          subtitle="Deep work logged per week"
          data={hours.slice(-range)}
          range={range}
          accent={light ? '#0f766e' : '#2dd4bf'}
          accentRgb={light ? '15 118 110' : '45 212 191'}
          gradientId="hours-fill"
          unit="h"
        />
      </div>
    </section>
  )
}
