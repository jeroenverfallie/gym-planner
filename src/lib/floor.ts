import { BLK_BOX_RACK, PULLUP_REACHES, type Placed, WALL_BALL_TARGETS, isTypeId, typeOf } from '#/lib/equipment'

/** Floor plan model. Pure functions only — no React in here. */

/** Room size in metres. */
export const WIDTH_M = 16
export const HEIGHT_M = 12
/** Cells per metre. The floor is stored at 0.5 m resolution; 1 m marking paints aligned 2×2 blocks. */
export const SUB = 2
export const COLS = WIDTH_M * SUB
export const ROWS = HEIGHT_M * SUB
/** Named areas used when planning workouts (rows are 1 m): the rig is the rack side, the mat the far side. */
export const ZONES = [
  // `labelY` is where the name is drawn: nudged so it looks centred despite the rack / dead space.
  { id: 'rig', label: 'Rig', y0: 0, y1: 4, labelY: 2.5 }, // rows A–D, label on C
  { id: 'turf', label: 'Turf', y0: 4, y1: 8, labelY: 6 }, // rows E–H
  { id: 'mat', label: 'Mat', y0: 8, y1: 12, labelY: 9.5 }, // rows I–L, label on J
] as const

/** Area of one stored cell in m². */
export const CELL_AREA = 1 / (SUB * SUB)

/** `dead` = unusable space (pillars, doors, walls…). Everything else is `open` training floor. */
export type Cell = 'open' | 'dead'

/** What the floor is made of. Independent of `Cell`: turf can run under dead space. */
export type Surface = 'tile' | 'turf'

/** Anything the editor can paint: the dead/open layer or the surface layer. */
export type Brush = Cell | Surface

export type Floor = {
  cols: number
  rows: number
  cells: Cell[] // row-major, length = cols * rows
  surface: Surface[] // same shape as cells
  items: Placed[] // movable equipment, positions in metres
  /** Fixed equipment in use, so its safe area is claimed: indexes of the rack parts, and the wall ball targets. */
  /** `rig`: switched-on rack stations; `wallBalls`: switched-on wall ball targets (indices into WALL_BALL_TARGETS). */
  active: { rig: number[]; wallBalls: number[]; /** Pull-up bay (rack part index) to the depth its safe area claims, when longer than plain pull-ups (TRX). */ reach?: Record<number, number> }
}

export type Point = { col: number; row: number }

export function createFloor(cols = COLS, rows = ROWS): Floor {
  return { cols, rows, cells: Array<Cell>(cols * rows).fill('open'), surface: Array<Surface>(cols * rows).fill('tile'),
    items: [],
    active: { rig: [], wallBalls: [] },
  }
}

export const indexOf = (f: Floor, p: Point) => p.row * f.cols + p.col

export function inBounds(f: Floor, p: Point) {
  return p.col >= 0 && p.col < f.cols && p.row >= 0 && p.row < f.rows
}

/** Bresenham line, inclusive of both ends. */
export function linePoints(a: Point, b: Point): Point[] {
  const pts: Point[] = []
  let { col, row } = a
  const dx = Math.abs(b.col - a.col)
  const dy = -Math.abs(b.row - a.row)
  const sx = a.col < b.col ? 1 : -1
  const sy = a.row < b.row ? 1 : -1
  let err = dx + dy
  for (;;) {
    pts.push({ col, row })
    if (col === b.col && row === b.row) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      col += sx
    }
    if (e2 <= dx) {
      err += dx
      row += sy
    }
  }
  return pts
}

/** Filled rectangle between two corner cells, inclusive. */
export function rectPoints(a: Point, b: Point): Point[] {
  const pts: Point[] = []
  for (let row = Math.min(a.row, b.row); row <= Math.max(a.row, b.row); row++) {
    for (let col = Math.min(a.col, b.col); col <= Math.max(a.col, b.col); col++) {
      pts.push({ col, row })
    }
  }
  return pts
}

/** Expands points given in `step`-sized units (1 = half-metre cells, 2 = whole metres) into stored cells. */
export function expand(points: Point[], step: number): Point[] {
  if (step === 1) return points
  const out: Point[] = []
  for (const p of points)
    for (let r = 0; r < step; r++)
      for (let c = 0; c < step; c++) out.push({ col: p.col * step + c, row: p.row * step + r })
  return out
}

/** The brush that undoes `b`: dead ↔ open, turf ↔ tile. */
export const oppositeBrush = (b: Brush): Brush =>
  b === 'dead' ? 'open' : b === 'open' ? 'dead' : b === 'turf' ? 'tile' : 'turf'

/** Returns a new floor with `brush` applied to every in-bounds point. */
export function paint(f: Floor, points: Point[], brush: Brush): Floor {
  const layer = brush === 'dead' || brush === 'open' ? 'cells' : 'surface'
  const next = f[layer].slice() as Brush[]
  for (const p of points) if (inBounds(f, p)) next[indexOf(f, p)] = brush
  return { ...f, [layer]: next }
}

export function sameCells(a: Floor, b: Floor) {
  return (
    a.cells.every((c, i) => c === b.cells[i]) &&
    a.surface.every((c, i) => c === b.surface[i]) &&
    a.active.rig.length === b.active.rig.length &&
    a.active.rig.every((v, i) => v === b.active.rig[i]) &&
    JSON.stringify(a.active.reach ?? {}) === JSON.stringify(b.active.reach ?? {}) &&
    a.active.wallBalls.length === b.active.wallBalls.length &&
    a.active.wallBalls.every((v, i) => v === b.active.wallBalls[i]) &&
    a.items.length === b.items.length &&
    a.items.every((it, i) => {
      const o = b.items[i]
      return (
        it.id === o.id && it.type === o.type && it.x === o.x && it.y === o.y && it.rotated === o.rotated && !!it.upright === !!o.upright &&
        !!it.stored === !!o.stored &&
        !!it.flip === !!o.flip &&
        it.safeMode === o.safeMode &&
        it.w === o.w &&
        it.h === o.h
      )
    })
  )
}

export function countDead(f: Floor) {
  return f.cells.reduce((n, c) => n + (c === 'dead' ? 1 : 0), 0)
}

export function countTurf(f: Floor) {
  return f.surface.reduce((n, c) => n + (c === 'turf' ? 1 : 0), 0)
}

/* ---------- persistence (compact strings: cells 0 open / 1 dead; surface 0 tile / 1 turf) ---------- */

export function serialize(f: Floor) {
  return JSON.stringify({
    cols: f.cols,
    rows: f.rows,
    cells: f.cells.map((c) => (c === 'dead' ? '1' : '0')).join(''),
    surface: f.surface.map((c) => (c === 'turf' ? '1' : '0')).join(''),
    items: f.items,
    active: f.active,
  })
}

/**
 * Older saves had no surface layer and may be whole-metre (16×12); `fallbackSurface`
 * (stored resolution) fills in the surface for those.
 */
export function deserialize(raw: string | null, fallbackSurface?: Surface[]): Floor | null {
  if (!raw) return null
  try {
    const { cols, rows, cells, surface, items, active: savedActive } = JSON.parse(raw)
    const partCount = BLK_BOX_RACK.parts.length
    const rig: number[] = Array.isArray(savedActive?.rig)
      ? [...new Set<number>(savedActive.rig)].filter((i) => Number.isInteger(i) && i >= 0 && i < partCount).sort((a, b) => a - b)
      : savedActive?.rig // older saves: the whole rig was one switch
        ? Array.from({ length: partCount }, (_, i) => i)
        : []
    const targets = WALL_BALL_TARGETS.length
    const wallBalls: number[] = Array.isArray(savedActive?.wallBalls)
      ? [...new Set<number>(savedActive.wallBalls)].filter((i) => Number.isInteger(i) && i >= 0 && i < targets).sort((a, b) => a - b)
      : savedActive?.wallBalls // older saves: all the targets were one switch
        ? Array.from({ length: targets }, (_, i) => i)
        : []
    const reach: Record<number, number> = {}
    for (const [k, v] of Object.entries(savedActive?.reach ?? {})) {
      const i = Number(k)
      if (rig.includes(i) && BLK_BOX_RACK.parts[i]?.kind === 'pullup' && PULLUP_REACHES.includes(v as number) && v !== PULLUP_REACHES[0]) reach[i] = v as number
    }
    const active = { rig, wallBalls, reach }
    if (typeof cells !== 'string' || cells.length !== cols * rows) return null
    // '2' was the short-lived storage zone type; it reads back as plain dead space.
    const dead = (c: string): Cell => (c === '1' || c === '2' ? 'dead' : 'open')
    const turf = (c: string): Surface => (c === '1' ? 'turf' : 'tile')
    // The fixed M and S workout spaces became sizes of the one resizable space.
    const LEGACY_SPACES: Record<string, { w: number; h: number }> = { 'space-m': { w: 1.2, h: 2 }, 'space-s': { w: 1, h: 1 } }
    const placed = (): Placed[] =>
      Array.isArray(items)
        ? items
            .map((i: Placed): Placed => (LEGACY_SPACES[i?.type as string] ? { ...i, type: 'space' as const, ...LEGACY_SPACES[i.type as string] } : i))
            .map((i: Placed): Placed => (typeOf(i.type)?.upright ? { ...i, upright: !!i.stored } : i)) // stored RowErgs stand on end, in use ones lie flat
            .filter(
            (i: Placed) =>
              typeof i?.id === 'string' &&
              isTypeId(i.type) &&
              typeof i.x === 'number' &&
              typeof i.y === 'number' &&
              typeof i.rotated === 'boolean' &&
              (i.upright === undefined || typeof i.upright === 'boolean') &&
              (i.stored === undefined || typeof i.stored === 'boolean') &&
              (i.w === undefined || typeof i.w === 'number') &&
              (i.h === undefined || typeof i.h === 'number'),
          )
        : []
    const surf = (): Surface[] =>
      typeof surface === 'string' && surface.length === cells.length
        ? [...surface].map(turf)
        : (fallbackSurface?.slice() ?? Array<Surface>(COLS * ROWS).fill('tile'))

    if (cols === COLS && rows === ROWS) return { cols, rows, cells: [...cells].map(dead), surface: surf(), items: placed(), active }
    // Whole-metre saves: scale each cell up to a SUB×SUB block.
    if (cols === WIDTH_M && rows === HEIGHT_M) {
      const out = createFloor()
      for (let i = 0; i < out.cells.length; i++) {
        const col = Math.floor((i % COLS) / SUB)
        const row = Math.floor(Math.floor(i / COLS) / SUB)
        out.cells[i] = dead(cells[row * cols + col])
      }
      out.surface = surf()
      out.items = placed()
      out.active = active
      return out
    }
    return null
  } catch {
    return null
  }
}
