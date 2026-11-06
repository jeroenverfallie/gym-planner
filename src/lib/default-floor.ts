import { isPermanent, type Placed } from '#/lib/equipment'
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

/**
 * Permanent equipment must always be on the plan. If a saved layout is missing any (an older save), put the
 * default copy back, stored, where the default has it.
 */
export function restoreMissing(items: Placed[]): Placed[] {
  const have = new Set(items.map((i) => i.id))
  const missing = DEFAULT_ITEMS.filter((d) => isPermanent(d.type) && !have.has(d.id)).map((d) => ({ ...d }))
  return missing.length ? [...items, ...missing] : items
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
