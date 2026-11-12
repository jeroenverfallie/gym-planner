import { EQUIPMENT_TYPES, type Placed, isPermanent, typeOf } from '#/lib/equipment'
import { type Inventory, ownedOf, readInventory } from '#/lib/inventory'
import { hasConflict } from '#/lib/placement'
import { COLS, SUB, type Floor, createFloor, paint, rectPoints } from '#/lib/floor'

/**
 * The gym's default layout, one string per 0.5 m row (32 × 24). `0` = open, `1` = dead.
 * Used on first load and by "Reset to default".
 */
const DEFAULT_ROWS = [
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '11110000000000000000000000000000',
  '11110000000000000000000000000000',
  '11110000000000000000000000000000',
  '11110000000000000000000000000000',
  '11110000000000000000000000000000',
  '11110000000000000000000000000000',
  '11110000000000111111111111111111',
  '11110000000000111111111111111111',
]

/**
 * Default equipment: everything put away (stored), tidied against the walls. Left column
 * left-aligned, right column flush with the right wall, each type evenly spaced.
 */
const DEFAULT_ITEMS: Placed[] = [
  { id: 'echo-bike-1', type: 'echo-bike', x: 0.0, y: 0.0, rotated: false, stored: true },
  { id: 'echo-bike-2', type: 'echo-bike', x: 0.0, y: 0.75, rotated: false, stored: true },
  { id: 'bikeerg-1', type: 'bikeerg', x: 0.0, y: 1.61, rotated: false, stored: true },
  { id: 'bikeerg-2', type: 'bikeerg', x: 0.0, y: 2.25, rotated: false, stored: true },
  { id: 'bikeerg-3', type: 'bikeerg', x: 0.0, y: 2.9, rotated: false, stored: true },
  { id: 'bikeerg-4', type: 'bikeerg', x: 0.0, y: 3.54, rotated: false, stored: true },
  { id: 'runner-1', type: 'runner', x: 14.18, y: 0.0, rotated: true, stored: true },
  { id: 'runner-2', type: 'runner', x: 15.09, y: 0.0, rotated: true, stored: true },
  { id: 'rowerg-1', type: 'rowerg', x: 15.36, y: 1.66, rotated: false, upright: true, stored: true },
  { id: 'rowerg-2', type: 'rowerg', x: 15.36, y: 2.26, rotated: false, upright: true, stored: true },
  { id: 'rowerg-3', type: 'rowerg', x: 15.36, y: 2.86, rotated: false, upright: true, stored: true },
  { id: 'rowerg-4', type: 'rowerg', x: 15.36, y: 3.46, rotated: false, upright: true, stored: true },
  { id: 'sled-1', type: 'sled', x: 14.98, y: 4.82, rotated: false, stored: true },
  { id: 'sled-2', type: 'sled', x: 14.98, y: 5.84, rotated: false, stored: true },
  { id: 'sled-3', type: 'sled', x: 14.98, y: 6.86, rotated: false, stored: true },
  { id: 'skierg-1', type: 'skierg', x: 14.73, y: 8.08, rotated: false, stored: true },
  { id: 'skierg-2', type: 'skierg', x: 14.73, y: 8.76, rotated: false, stored: true },
  { id: 'skierg-3', type: 'skierg', x: 14.73, y: 9.44, rotated: false, stored: true },
  { id: 'skierg-4', type: 'skierg', x: 14.73, y: 10.12, rotated: false, stored: true },
  // Plyo boxes: stacks of 2, 3, 2 and 1 (rotated, as saved) down the left wall in E–H.
  { id: 'plyo-1', type: 'plyo', x: 0, y: 4.34, rotated: true, stored: true },
  { id: 'plyo-2', type: 'plyo', x: 0, y: 4.34, rotated: true, stored: true },
  { id: 'plyo-3', type: 'plyo', x: 0.01, y: 5.14, rotated: true, stored: true },
  { id: 'plyo-4', type: 'plyo', x: 0.01, y: 5.14, rotated: true, stored: true },
  { id: 'plyo-5', type: 'plyo', x: 0, y: 6.71, rotated: true, stored: true },
  { id: 'plyo-6', type: 'plyo', x: 0, y: 5.93, rotated: true, stored: true },
  { id: 'plyo-7', type: 'plyo', x: 0, y: 5.93, rotated: true, stored: true },
  { id: 'plyo-8', type: 'plyo', x: 0.01, y: 5.14, rotated: true, stored: true },
]

/** First free spot (0.5 m steps) for a new stored item: open floor, nothing else in the way. */
function freeSpot(item: Placed, items: Placed[]): { x: number; y: number } {
  const floor = { ...defaultFloor(), items }
  for (let y = 0; y <= 11.5; y += 0.5)
    for (let x = 0; x <= 15.5; x += 0.5) {
      const probe = { ...item, x, y }
      if (!hasConflict(floor, probe, items)) return { x, y }
    }
  return { x: 0, y: 0 }
}

/** Where a permanent item is kept when not in use: its default stored spot, or the first free one for extra units. */
export function storedHome(item: Placed, items: Placed[]): Placed {
  const d = DEFAULT_ITEMS.find((i) => i.id === item.id)
  if (d) return { ...d }
  const stored: Placed = { id: item.id, type: item.type, x: 0, y: 0, rotated: false, stored: true, ...(typeOf(item.type).upright ? { upright: true } : {}) }
  return { ...stored, ...freeSpot(stored, items.filter((i) => i.id !== item.id)) }
}

/**
 * Permanent equipment must always be on the plan, and exactly as many as the gym owns (Settings). Missing ones
 * come back stored (the default copy where the default has it, otherwise the first free spot); surplus ones are
 * dropped, stored ones first.
 */
export function restoreMissing(items: Placed[], inv: Inventory = readInventory()): Placed[] {
  let out = items
  for (const t of EQUIPMENT_TYPES) {
    if (!isPermanent(t.id)) continue
    const want = ownedOf(inv, t.id)
    const have = out.filter((i) => i.type === t.id)
    if (have.length > want) {
      const order = [...have.filter((i) => i.stored).reverse(), ...have.filter((i) => !i.stored).reverse()]
      const drop = new Set(order.slice(0, have.length - want).map((i) => i.id))
      out = out.filter((i) => !drop.has(i.id))
    } else if (have.length < want) {
      const ids = new Set(out.map((i) => i.id))
      const add: Placed[] = DEFAULT_ITEMS.filter((d) => d.type === t.id && !ids.has(d.id)).slice(0, want - have.length).map((d) => ({ ...d }))
      out = [...out, ...add]
      for (let n = have.length + add.length; n < want; n++) {
        let k = n + 1
        while (out.some((i) => i.id === `${t.id}-${k}`)) k++
        const base: Placed = { id: `${t.id}-${k}`, type: t.id, x: 0, y: 0, rotated: false, stored: true }
        out = [...out, { ...base, ...freeSpot(base, out) }]
      }
    }
  }
  return out
}

export function defaultFloor(): Floor {
  const floor = createFloor()
  DEFAULT_ROWS.forEach((row, r) => {
    for (let c = 0; c < COLS; c++) if (row[c] === '1') floor.cells[r * COLS + c] = 'dead'
  })
  // Turf: 4 × 16 m, rows E–H, columns 1–16 (metres → stored cells).
  const withTurf = paint(floor, rectPoints({ col: 0, row: 4 * SUB }, { col: COLS - 1, row: 8 * SUB - 1 }), 'turf')
  return { ...withTurf, items: DEFAULT_ITEMS.map((i) => ({ ...i })) }
}
