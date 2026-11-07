/**
 * Fixed equipment: things bolted to the room that can't be moved or drawn.
 * Positions are in metres (not grid cells) so sizes like 0.9 m are exact.
 */

export type StationKind = 'barbell' | 'pull' | 'pullup'

export const STATION_KINDS: Record<StationKind, { label: string; short: string }> = {
  barbell: { label: 'Barbell / squat', short: 'B' },
  pull: { label: 'Pull (pillar)', short: 'P' },
  pullup: { label: 'Pull-up / storage', short: 'PU' },
}

/** One segment along the front of a piece of equipment. */
export type Part = { kind: StationKind; width: number }

export type FixedEquipment = {
  id: string
  name: string
  maker: string
  /** Top-left corner, metres from the room's top-left. */
  x: number
  y: number
  width: number
  height: number
  /** Segments left to right; their widths must add up to `width`. */
  parts: Part[]
}

/*
 * Pillars are shared between neighbouring bays and every pillar carries a pull station:
 *   pull | barbell | pull | pull-up | pull | barbell | pull | pull-up | pull | barbell | pull | pull-up | pull | barbell | pull
 * = 4 barbell bays, 3 pull-up bays, 8 pillars.
 * Barbell bay = 1.2 m (BLK BOX's published squat-bay width). Pillar width (0.2 m) is an estimate;
 * the pull-up bays take whatever is left of the 12 m, so they stay consistent if it changes.
 */
const RACK_WIDTH = 12
const PILLAR = 0.2
const BARBELL_BAY = 1.2
const PULLUP_BAY = (RACK_WIDTH - 8 * PILLAR - 4 * BARBELL_BAY) / 3 // ≈ 1.87 m

const BAYS: StationKind[] = ['barbell', 'pullup', 'barbell', 'pullup', 'barbell', 'pullup', 'barbell']

const pillar: Part = { kind: 'pull', width: PILLAR }

/** BLK BOX rack, 12 × 0.9 m against the top wall, spanning A3–A14. */
export const BLK_BOX_RACK: FixedEquipment = {
  id: 'blk-box-rack',
  name: 'Rack',
  maker: 'BLK BOX',
  x: 2,
  y: 0,
  width: RACK_WIDTH,
  height: 0.9,
  parts: [pillar, ...BAYS.flatMap((kind): Part[] => [{ kind, width: kind === 'barbell' ? BARBELL_BAY : PULLUP_BAY }, pillar])],
}

export const FIXED_EQUIPMENT: FixedEquipment[] = [BLK_BOX_RACK]

export function countStations(e: FixedEquipment): Record<StationKind, number> {
  const out: Record<StationKind, number> = { barbell: 0, pull: 0, pullup: 0 }
  for (const part of e.parts) out[part.kind]++
  return out
}

/* ---------------------------------------------------------------------------
 * Movable equipment: what the user places on the floor.
 * Dimensions in metres, `length` runs along x when not rotated. From manufacturer/retailer specs:
 *  - Concept2 RowErg 96" × 24; SkiErg on floor stand 50" × 23.5"; BikeErg 48" × 24"
 *  - Rogue Echo Bike V3 overall 55" × 29.5" (seat back, at the handles)
 *  - "Curved runner": taken as the Rogue TrueForm Runner, 64" × 36" (Woodway Curve LTG is 67" × 34")
 *  - HYROX sled: Centr x HYROX Competition Power Sled, ~102 × 60 cm
 * Footprints are the machine only — user space and lane clearance come later.
 * ------------------------------------------------------------------------- */

export type EquipmentTypeId = 'echo-bike' | 'rowerg' | 'skierg' | 'bikeerg' | 'runner' | 'sled' | 'plyo' | 'bench' | 'softmat' | 'space'

/**
 * Safe area around a unit in use: `ends` beyond the short sides, `sides` beyond the long sides (before rotation).
 * `lane` adds runway beyond one end, toward the roomier side of the room (sleds).
 */
export type Safe = { ends: number; sides: number; lane?: number }

export type EquipmentType = {
  id: EquipmentTypeId
  name: string
  short: string
  color: string
  length: number
  depth: number
  /** How many the gym owns. */
  count: number
  /**
   * This type can stand upright on a free-standing unit of the given type (e.g. a RowErg
   * upright on a SkiErg base), so the two may overlap.
   */
  restsOn?: EquipmentTypeId
  /** Space needed around the unit while it's in use (metres, estimates for an average person). */
  safe: Safe
  /**
   * Always on the floor plan (stored or in use) and never deletable: the gym owns these, so they have to be
   * somewhere. Only benches, soft mats and workout spaces are added and removed per workout.
   */
  permanent?: boolean
  /** Can be drawn to any size (workout spaces and lanes): items carry their own `w` × `h`. */
  resizable?: boolean
  /** A planning marker, not a machine: drawn as an outline and left out of the equipment totals. */
  marker?: boolean
  /** Units of this type can stack on each other (same spot) up to this many high. */
  stackMax?: number
  /**
   * Compact footprint standing on its end (`length` = along x when not rotated, `depth` = along y).
   * Valid anywhere clear; sized from the SkiErg so it sits square on a SkiErg base.
   */
  upright?: { length: number; depth: number }
}

/** SkiErg on its floor stand. An upright RowErg is sized from it: its short side by half its long side. */
const SKIERG = { length: 1.27, depth: 0.6 }

export const EQUIPMENT_TYPES: EquipmentType[] = [
  { id: 'echo-bike', permanent: true, safe: { ends: 0.3, sides: 0.4 }, name: 'Rogue Echo Bike', short: 'Echo', color: '#ff6b57', length: 1.4, depth: 0.75, count: 2 },
  { id: 'rowerg', permanent: true, safe: { ends: 0.15, sides: 0.3 }, name: 'Concept2 RowErg', short: 'Row', color: '#4f9dff', length: 2.44, depth: 0.61, count: 4, restsOn: 'skierg',
    // Upright: as wide as the SkiErg's short side, half its long side in the other dimension.
    upright: { length: SKIERG.length / 2, depth: SKIERG.depth } },
  { id: 'skierg', permanent: true, safe: { ends: 0.3, sides: 0.4 }, name: 'Concept2 SkiErg', short: 'Ski', color: '#b6e04a', length: SKIERG.length, depth: SKIERG.depth, count: 4 },
  { id: 'bikeerg', permanent: true, safe: { ends: 0.3, sides: 0.4 }, name: 'Concept2 BikeErg', short: 'Bike', color: '#ff7ac8', length: 1.22, depth: 0.61, count: 4 },
  { id: 'runner', permanent: true, safe: { ends: 0.6, sides: 0.3 }, name: 'Rogue Curved Runner', short: 'Run', color: '#ececf1', length: 1.63, depth: 0.91, count: 2 },
  {
    id: 'plyo', permanent: true, safe: { ends: 0.6, sides: 0.6 },
    name: 'Stride Plyo Box',
    short: 'Box',
    color: '#d2a679',
    // 50 × 60 × 75 cm. Footprint is the largest face (75 × 60) lying on its side so stacks stay low and stable.
    length: 0.75,
    depth: 0.6,
    count: 8,
    stackMax: 3,
  },
  { id: 'sled', permanent: true, safe: { ends: 0, sides: 0.35, lane: 11.5 }, name: 'HYROX Sled', short: 'Sled', color: '#ffd23f', length: 1.02, depth: 0.6, count: 3 },
  // 1.2 × 0.4 m. Safe area: dumbbell work either side.
  { id: 'bench', safe: { ends: 0.4, sides: 0.6 }, name: 'Bench', short: 'Bench', color: '#b8a1ff', length: 1.2, depth: 0.4, count: 8 },
  // Size is an estimate (a standard exercise mat); floor work around it.
  { id: 'softmat', safe: { ends: 0.3, sides: 0.3 }, name: 'Soft mat', short: 'Mat', color: '#6ee7b7', length: 1.8, depth: 0.6, count: 8 },
  // Workout space: floor that must stay clear for a movement, drawn to any size: a 1 × 1 m spot for squats, a
  // 1.2 × 2 m patch for burpees and floor work, a 12 × 1.5 m lane for carries and jumps. The space itself is
  // the safe area, so it adds no margin: nothing else may stand in it. New ones start at 1.5 × 2.5 m.
  {
    id: 'space',
    safe: { ends: 0, sides: 0 },
    name: 'Workout space',
    short: 'Space',
    color: '#ffffff',
    length: 1.5,
    depth: 2.5,
    count: 24,
    marker: true,
    resizable: true,
  },
]

export const typeOf = (id: EquipmentTypeId) => EQUIPMENT_TYPES.find((t) => t.id === id)!
export const isPermanent = (id: EquipmentTypeId) => !!typeOf(id).permanent
export const isTypeId = (id: unknown): id is EquipmentTypeId => EQUIPMENT_TYPES.some((t) => t.id === id)

/** A piece of equipment placed on the floor. x/y = top-left corner in metres. */
export type Placed = {
  id: string
  type: EquipmentTypeId
  x: number
  y: number
  rotated: boolean
  /** Standing on its end (compact). Only for types with an `upright` footprint. */
  upright?: boolean
  /** Marked as not in use right now (put away); drawn see-through. */
  stored?: boolean
  /** Size on the floor, metres (x then y), for resizable types. Missing = the type's default. */
  w?: number
  h?: number
}

export type Rect = { x: number; y: number; w: number; h: number }

/** Width/height on the floor, honouring rotation. */
export function sizeOf(type: EquipmentTypeId, rotated: boolean, upright = false) {
  const t = typeOf(type)
  const d = upright && t.upright ? t.upright : t
  return rotated ? { w: d.depth, h: d.length } : { w: d.length, h: d.depth }
}

/** Presets for the resizable workout space: small stationary, medium floor work, large travelling movements. */
export const SPACE_PRESETS = [
  { label: 'S', w: 1, h: 1 },
  { label: 'M', w: 1.2, h: 2 },
  { label: 'L', w: 1.5, h: 2.5 },
] as const
export const MIN_SPACE = 0.5

export function footprint(p: Placed): Rect {
  if (typeOf(p.type).resizable && p.w && p.h) return { x: p.x, y: p.y, w: p.w, h: p.h }
  return { x: p.x, y: p.y, ...sizeOf(p.type, p.rotated, p.upright) }
}

/* ---------------------------------------------------------------------------
 * Overhead equipment: hangs in the air, so it never blocks anything below it.
 * Drawn on top of the floor but excluded from conflict checks.
 * ------------------------------------------------------------------------- */

export type OverheadEquipment = { id: string; name: string; x: number; y: number; width: number; height: number }

/** Wall ball targets are wall-mounted, centred on the middle of a row on the right wall (x = 16 m). */
const ROOM_RIGHT_M = 16
// Marker size is an estimate: 0.2 m projecting from the wall, 0.6 m along it.
const TARGET = { depth: 0.2, along: 0.6 }

export const WALL_BALL_TARGETS: OverheadEquipment[] = ['B', 'D', 'I', 'K'].map((row) => ({
  id: `wall-ball-${row}16`,
  name: `Wall ball target ${row}16`,
  x: ROOM_RIGHT_M - TARGET.depth,
  y: row.charCodeAt(0) - 65 + 0.5 - TARGET.along / 2,
  width: TARGET.depth,
  height: TARGET.along,
}))

/* ---------------------------------------------------------------------------
 * Safe areas. Nobody and nothing else should be inside a claimed safe area. Two safe areas may overlap
 * (shared aisle); what may not happen is another unit standing inside one. Estimates for an average person.
 * ------------------------------------------------------------------------- */

const ROOM_W = 16
const ROOM_H = 12

const clampRect = (r: Rect): Rect => {
  const x0 = Math.max(0, r.x)
  const y0 = Math.max(0, r.y)
  return { x: x0, y: y0, w: Math.max(0, Math.min(ROOM_W, r.x + r.w) - x0), h: Math.max(0, Math.min(ROOM_H, r.y + r.h) - y0) }
}

/** The safe area of a movable unit that is in use. Lanes run toward the roomier side of the room. */
export function safeRect(p: Placed): Rect {
  const f = footprint(p)
  const { ends, sides, lane = 0 } = typeOf(p.type).safe
  if (!p.rotated) {
    const toRight = f.x + f.w / 2 < ROOM_W / 2
    return clampRect({ x: f.x - ends - (toRight ? 0 : lane), y: f.y - sides, w: f.w + 2 * ends + lane, h: f.h + 2 * sides })
  }
  const toBottom = f.y + f.h / 2 < ROOM_H / 2
  return clampRect({ x: f.x - sides, y: f.y - ends - (toBottom ? 0 : lane), w: f.w + 2 * sides, h: f.h + 2 * ends + lane })
}

/** Depth in front of the rack (south of it) a person needs per station kind. */
const RACK_SAFE_DEPTH: Record<StationKind, number> = { barbell: 2.0, pull: 1.4, pullup: 1.0 }
/** A pull station is a thin pillar; the person stands about a metre wide in front of it. */
const PULL_SAFE_WIDTH = 1.0

/** Safe areas of the rack's parts. With `active`, only the parts (by index into `rack.parts`) that are in use. */
export function rackSafeRects(rack: FixedEquipment = BLK_BOX_RACK, active?: number[]): Rect[] {
  const out: Rect[] = []
  let x = rack.x
  rack.parts.forEach((part, i) => {
    const w = part.kind === 'pull' ? PULL_SAFE_WIDTH : part.width
    if (!active || active.includes(i))
      out.push(clampRect({ x: x + part.width / 2 - w / 2, y: rack.y + rack.height, w, h: RACK_SAFE_DEPTH[part.kind] }))
    x += part.width
  })
  return out
}

/** Indexes of the rack parts of one kind (e.g. all 8 pull pillars). */
export const rackPartsOfKind = (kind: StationKind, rack: FixedEquipment = BLK_BOX_RACK) =>
  rack.parts.flatMap((p, i) => (p.kind === kind ? [i] : []))

/**
 * A barbell bay and the pull stations (pillars) flanking it are either/or: a lifter at the bay and someone on the
 * pillar would be on top of each other. Returns the parts that can't be in use together with part `i`.
 * Pull-up bays exclude nothing.
 */
export function rackExclusions(i: number, rack: FixedEquipment = BLK_BOX_RACK): number[] {
  const kind = rack.parts[i].kind
  const other: StationKind | null = kind === 'barbell' ? 'pull' : kind === 'pull' ? 'barbell' : null
  if (!other) return []
  return [i - 1, i + 1].filter((j) => rack.parts[j]?.kind === other)
}

/** Which rack part sits at the point (metres), if any. */
export function rackPartAt(m: { x: number; y: number }, rack: FixedEquipment = BLK_BOX_RACK): number | null {
  if (m.y < rack.y || m.y > rack.y + rack.height) return null
  let x = rack.x
  for (let i = 0; i < rack.parts.length; i++) {
    if (m.x >= x && m.x < x + rack.parts[i].width) return i
    x += rack.parts[i].width
  }
  return null
}

/** Throwing and landing space in front of a wall ball target: 1.8 m wide, 2.5 m out from the wall. */
const WALL_BALL_SAFE = { along: 1.8, depth: 2.5 }

export function wallBallSafeRects(): Rect[] {
  return WALL_BALL_TARGETS.map((t) =>
    clampRect({
      x: t.x + t.width - WALL_BALL_SAFE.depth,
      y: t.y + t.height / 2 - WALL_BALL_SAFE.along / 2,
      w: WALL_BALL_SAFE.depth,
      h: WALL_BALL_SAFE.along,
    }),
  )
}
