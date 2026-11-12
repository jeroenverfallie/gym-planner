import { useEffect, useState } from 'react'
import { type Rotation, STYLES, type Style, fmtTime, parseTime, sectionSeconds } from '#/lib/templates'

/** A time as "m:ss": commits on blur or Enter, and reverts if what was typed isn't a time. */
export function TimeField({ value, onChange, label }: { value: number; onChange: (s: number) => void; label: string }) {
  const [text, setText] = useState(fmtTime(value))
  useEffect(() => setText(fmtTime(value)), [value])
  const commit = () => {
    const s = parseTime(text)
    if (s !== null && s >= 0) onChange(s)
    else setText(fmtTime(value))
  }
  return (
    <label className="dim">
      {label}
      <input
        className="field num"
        value={text}
        inputMode="numeric"
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label={label}
      />
    </label>
  )
}

/** A whole number within [min, max]. */
export function NumField({ value, onChange, label, min = 1, max = 99 }: { value: number; onChange: (n: number) => void; label: string; min?: number; max?: number }) {
  return (
    <label className="dim">
      {label}
      <input
        className="field num"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = e.target.valueAsNumber
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n))))
        }}
        aria-label={label}
      />
    </label>
  )
}

/** How a section runs: style, rounds, work, rest and the move between sections. Shows the resulting time. */
export function RotationFields({ rotation, stations, factor = 1, onChange }: { rotation: Rotation; stations: number; factor?: number; onChange: (r: Rotation) => void }) {
  const set = (patch: Partial<Rotation>) => onChange({ ...rotation, ...patch })
  const style = STYLES.find((s) => s.id === rotation.style)
  return (
    <div className="rotation">
      <div className="row">
        <label className="dim">
          Format
          <select className="field" value={rotation.style} onChange={(e) => set({ style: e.target.value as Style })} aria-label="Rotation format">
            {STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <NumField label="Rounds" value={rotation.rounds} onChange={(rounds) => set({ rounds })} max={20} />
        <TimeField label="Work" value={rotation.work} onChange={(work) => set({ work })} />
        <TimeField label="Rest" value={rotation.rest} onChange={(rest) => set({ rest })} />
        <TimeField label="Swap" value={rotation.move} onChange={(move) => set({ move })} />
        <span className="time-total" title="Rest and moves included">
          = {fmtTime(sectionSeconds(rotation, stations, factor))}
        </span>
      </div>
      {style && <p className="muted">{style.blurb}</p>}
    </div>
  )
}
