import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { NumField } from '#/components/TemplateParts'
import type { EquipmentTypeId } from '#/lib/equipment'
import { typeOf } from '#/lib/equipment'
import { type Inventory, type WeightCount, defaultInventory, ownedOf, readInventory, totalOf, writeInventory } from '#/lib/inventory'

export const Route = createFileRoute('/settings')({ component: Settings })

const GROUPS: { title: string; note?: string; ids: EquipmentTypeId[] }[] = [
  { title: 'Cardio machines', note: 'Always on the floor plan (stored when a workout does not use them).', ids: ['echo-bike', 'rowerg', 'skierg', 'bikeerg', 'runner'] },
  { title: 'Sleds and boxes', note: 'Also always on the floor plan.', ids: ['sled', 'plyo'] },
  { title: 'Benches and soft mats', note: 'Added to the floor plan per workout.', ids: ['bench', 'softmat'] },
]

function Settings() {
  const [inv, setInv] = useState<Inventory | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  // The inventory lives in this browser: read it after mount.
  useEffect(() => setInv(readInventory()), [])

  if (!inv) return <main className="page wide"><h1>Settings</h1></main>

  const save = (next: Inventory) => {
    setInv(next)
    writeInventory(next)
  }
  const setCount = (id: EquipmentTypeId, n: number) => save({ ...inv, counts: { ...inv.counts, [id]: n } })

  return (
    <main className="page wide">
      <h1>Settings</h1>
      <p className="sub">
        What the gym owns. The planner limits how much of it you can place, the floor plan keeps exactly this many machines, sleds and
        boxes, and generated workouts never use more than there is. Changes save as you type.
      </p>

      <div className="editor-col">
        <Weights title="Kettlebells" list={inv.kettlebells} onChange={(kettlebells) => save({ ...inv, kettlebells })} />
        <Weights title="Dumbbells" list={inv.dumbbells} onChange={(dumbbells) => save({ ...inv, dumbbells })} />

        {GROUPS.map((g) => (
          <section className="panel" key={g.title} aria-label={g.title}>
            <b>{g.title}</b>
            {g.note && <p className="muted">{g.note}</p>}
            <div className="inv-grid">
              {g.ids.map((id) => {
                const t = typeOf(id)
                return (
                  <div className="inv-row" key={id}>
                    <i className="chip-dot" style={{ background: t.color }} />
                    <span className="inv-name">
                      {t.name}
                      <small className="muted">
                        {' '}
                        {t.length} × {t.depth} m
                      </small>
                    </span>
                    <NumField label="How many" min={0} max={40} value={ownedOf(inv, id)} onChange={(n) => setCount(id, n)} />
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        <section className="panel">
          <div className="row">
            <p className="muted">The rack (4 barbell bays, 8 pulls, 3 pull-up bays) and the 4 wall ball targets are fixed to the building.</p>
            <span className="spacer" />
            {confirmReset ? (
              <span className="confirm" role="alertdialog" aria-label="Confirm resetting the inventory">
                <b>Reset everything to the defaults?</b>
                <button
                  className="btn danger"
                  autoFocus
                  onClick={() => {
                    save(defaultInventory())
                    setConfirmReset(false)
                  }}
                >
                  Yes, reset
                </button>
                <button className="btn" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </span>
            ) : (
              <button className="btn" onClick={() => setConfirmReset(true)}>
                Reset to defaults
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function Weights({ title, list, onChange }: { title: string; list: WeightCount[]; onChange: (l: WeightCount[]) => void }) {
  const set = (i: number, patch: Partial<WeightCount>) => onChange(list.map((w, j) => (j === i ? { ...w, ...patch } : w)))
  const add = () => {
    const next = list.length ? Math.max(...list.map((w) => w.kg)) + 4 : 8
    onChange([...list, { kg: next, count: 2 }])
  }
  return (
    <section className="panel" aria-label={title}>
      <div className="row">
        <b>{title}</b>
        <span className="muted">{totalOf(list)} in total</span>
      </div>
      <div className="inv-grid">
        {list.map((w, i) => (
          <div className="inv-row" key={i}>
            <NumField label="kg" min={1} max={100} value={w.kg} onChange={(kg) => set(i, { kg })} />
            <NumField label="How many" min={0} max={40} value={w.count} onChange={(count) => set(i, { count })} />
            <span className="spacer" />
            <button className="btn ghost" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label={`Remove ${w.kg} kg`}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="row">
        <button className="btn" onClick={add}>
          Add a weight
        </button>
      </div>
    </section>
  )
}
