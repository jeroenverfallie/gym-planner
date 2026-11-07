import {
  FIXED_EQUIPMENT,
  type Placed,
  type Rect,
  footprint,
  BLK_BOX_RACK,
  rackSafeRects,
  safeRect,
  typeOf,
  wallBallSafeRects,
} from '#/lib/equipment'
import { COLS, ROWS, SUB, type Floor } from '#/lib/floor'

/** Overlaps smaller than this (metres) are ignored: the grid snaps in 0.5 m steps, machines aren't that tidy. */
const TOL = 0.05

const overlaps = (a: Rect, b: Rect, tol = TOL) =>
  a.x < b.x + b.w - tol && b.x < a.x + a.w - tol && a.y < b.y + b.h - tol && b.y < a.y + a.h - tol

const EPS = 1e-6

/** True if the footprint sits on fixed dead space (pillars, doors, walls): nothing may stand there, stored or not. */
function overlapsDead(floor: Floor, r: Rect): boolean {
  const c0 = Math.max(0, Math.floor((r.x + TOL) * SUB + EPS))
  const c1 = Math.min(COLS - 1, Math.ceil((r.x + r.w - TOL) * SUB - EPS) - 1)
  const r0 = Math.max(0, Math.floor((r.y + TOL) * SUB + EPS))
  const r1 = Math.min(ROWS - 1, Math.ceil((r.y + r.h - TOL) * SUB - EPS) - 1)
  for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) if (floor.cells[row * COLS + col] === 'dead') return true
  return false
}

const STACK_TOL = 0.02

/** Same type, same orientation, same spot (within a couple of cm): one stack. */
const sameStack = (a: Placed, b: Placed) =>
  a.type === b.type && !!a.rotated === !!b.rotated && Math.abs(a.x - b.x) < STACK_TOL && Math.abs(a.y - b.y) < STACK_TOL

/** How many units are in `item`'s stack (itself included, if it's in `items`). */
export function stackSize(item: Placed, items: Placed[]): number {
  return items.filter((o) => sameStack(item, o)).length
}

/**
 * Where a stackable item should land: if it overlaps another unit of its type that still has room,
 * it snaps exactly onto that unit's spot (joining its stack). Otherwise it stays where it is.
 */
export function snapToStack(items: Placed[], excludeId: string | null, probe: Placed): { x: number; y: number } {
  const max = typeOf(probe.type).stackMax
  const stay = { x: probe.x, y: probe.y }
  if (!max) return stay
  const others = items.filter((o) => o.id !== excludeId)
  const r = footprint(probe)
  let best: Placed | null = null
  let bestArea = 0
  for (const o of others) {
    if (o.type !== probe.type || !!o.rotated !== !!probe.rotated) continue
    const ro = footprint(o)
    const ow = Math.min(r.x + r.w, ro.x + ro.w) - Math.max(r.x, ro.x)
    const oh = Math.min(r.y + r.h, ro.y + ro.h) - Math.max(r.y, ro.y)
    if (ow <= TOL || oh <= TOL || stackSize(o, others) >= max) continue
    if (ow * oh > bestArea) {
      bestArea = ow * oh
      best = o
    }
  }
  return best ? { x: best.x, y: best.y } : stay
}

/** How many upright riders (RowErgs) one base (SkiErg) can carry. */
export const RIDERS_PER_BASE = 1

/** The base an upright rider is standing on, if any. */
export function restingOn(item: Placed, items: Placed[]): Placed | undefined {
  const baseType = typeOf(item.type).restsOn
  if (!baseType || !item.upright) return undefined
  return items.find(
    (o) => o.id !== item.id && o.type === baseType && overlaps(footprint(item), footprint(o)),
  )
}

/**
 * An item is in conflict if it stands on dead space, overlaps the rack's solid parts (barbell bays and pull
 * pillars; the pull-up bays are open) or overlaps another item. Exception: an upright RowErg may stand on a SkiErg's
 * base (each SkiErg carries at most RIDERS_PER_BASE).
 */
export function hasConflict(floor: Floor, item: Placed, others: Placed[]): boolean {
  const r = footprint(item)
  if (overlapsDead(floor, r)) return true

  for (const f of FIXED_EQUIPMENT) {
    let x = f.x
    for (const part of f.parts) {
      if (part.kind !== 'pullup' && overlaps(r, { x, y: f.y, w: part.width, h: f.height })) return true
      x += part.width
    }
  }

  const all = others.some((o) => o.id === item.id) ? others : [...others, item]
  for (const o of others) {
    if (o.id === item.id || !overlaps(r, footprint(o))) continue
    if (typeOf(item.type).stackMax && o.type === item.type) {
      if (!sameStack(item, o)) return true // overlapping but not squarely stacked
      continue
    }
    const itemRides = typeOf(item.type).restsOn === o.type && !!item.upright
    const otherRides = typeOf(o.type).restsOn === item.type && !!o.upright
    if (!(itemRides || otherRides)) return true
    // base carries too many riders?
    const base = itemRides ? o : item
    const riders = all.filter(
      (x) => typeOf(x.type).restsOn === base.type && x.upright && overlaps(footprint(x), footprint(base)),
    )
    if (riders.length > RIDERS_PER_BASE) return true
  }
  const max = typeOf(item.type).stackMax
  if (max && stackSize(item, all) > max) return true
  return false
}

/**
 * Items that are too close for safety: anything standing inside the safe area of a unit in use, of the
 * rig when it is in use, or of a wall ball target in use; and in-use units whose own safe area touches
 * the rack's solid parts. Stored units claim no safe area, but still count as obstacles.
 */
export function safetyWarnings(items: Placed[], active: { rig: number[]; wallBalls: boolean }): Set<string> {
  const out = new Set<string>()
  const zones = [...rackSafeRects(BLK_BOX_RACK, active.rig), ...(active.wallBalls ? wallBallSafeRects() : [])]
  for (const b of items) if (zones.some((z) => overlaps(z, footprint(b)))) out.add(b.id)

  const solid: Rect[] = []
  for (const f of FIXED_EQUIPMENT) {
    let x = f.x
    for (const part of f.parts) {
      if (part.kind !== 'pullup') solid.push({ x, y: f.y, w: part.width, h: f.height })
      x += part.width
    }
  }

  const together = (a: Placed, b: Placed) =>
    sameStack(a, b) || (!!a.upright && typeOf(a.type).restsOn === b.type) || (!!b.upright && typeOf(b.type).restsOn === a.type)

  for (const a of items) {
    if (a.stored) continue
    const sa = safeRect(a)
    if (solid.some((s) => overlaps(sa, s))) out.add(a.id)
    for (const b of items) {
      if (b.id === a.id || together(a, b)) continue
      if (overlaps(sa, footprint(b))) {
        out.add(a.id)
        out.add(b.id)
      }
    }
  }
  return out
}

/* ---------------------------------------------------------------------------
 * Guided snapping, like a design tool: while you move, place or resize equipment its edges and centres snap to the
 * same kind of equipment nearby (alignment), and to equal spacing in a row or column. Each snap comes with guide
 * lines to draw. Hold Alt in the editor to skip it.
 * ------------------------------------------------------------------------- */

/** Snap distance in metres: about 6 px on a typical screen. */
export const SNAP = 0.15

/** A guide line to draw (metres). `align` marks a shared edge or centre; `gap` marks an equal gap. */
export type Guide = { x1: number; y1: number; x2: number; y2: number; kind: 'align' | 'gap' }

/** `rank` breaks ties between equally close snaps: matching lines (0) beat edge-to-edge (1), gaps (1), then centre-to-edge (2). */
type Cand = { delta: number; rank: number; make: (r: Rect) => Guide[] }

const lines3 = (a: number, size: number) => [a, a + size / 2, a + size]
const near = (a: number, b: number, tol = 0.005) => Math.abs(a - b) <= tol
/** i, j: 0 = start, 1 = centre, 2 = end. Same line first, then edge-to-edge, then anything with a centre. */
const lineRank = (i: number, j: number) => (i === j ? 0 : i !== 1 && j !== 1 ? 1 : 2)

/** Several matches on the same line become one guide (spanning all of them). */
function mergeGuides(guides: Guide[]): Guide[] {
  const out: Guide[] = []
  const align = new Map<string, Guide>()
  for (const g of guides) {
    if (g.kind !== 'align') {
      out.push(g)
      continue
    }
    const vertical = g.x1 === g.x2
    const key = `${vertical ? 'v' : 'h'}${(vertical ? g.x1 : g.y1).toFixed(3)}`
    const have = align.get(key)
    if (!have) align.set(key, { ...g })
    else {
      have.x1 = Math.min(have.x1, g.x1)
      have.x2 = Math.max(have.x2, g.x2)
      have.y1 = Math.min(have.y1, g.y1)
      have.y2 = Math.max(have.y2, g.y2)
    }
  }
  return [...align.values(), ...out]
}

/** Equal-gap candidates along one axis ('x' = along a row, 'y' = along a column). */
function gapCands(axis: 'x' | 'y', rect: Rect, others: Rect[], thr: number): Cand[] {
  const p = (r: Rect) => (axis === 'x' ? r.x : r.y) // start along the axis
  const s = (r: Rect) => (axis === 'x' ? r.w : r.h) // size along the axis
  const cp = (r: Rect) => (axis === 'x' ? r.y : r.x) // start across
  const cs = (r: Rect) => (axis === 'x' ? r.h : r.w) // size across
  const seg = (a: number, b: number, mid: number): Guide =>
    axis === 'x' ? { x1: a, x2: b, y1: mid, y2: mid, kind: 'gap' } : { x1: mid, x2: mid, y1: a, y2: b, kind: 'gap' }

  // only things in the same row/column (they overlap across the axis)
  const mates = others.filter((t) => cp(t) < cp(rect) + cs(rect) && cp(rect) < cp(t) + cs(t))
  const before = mates.filter((t) => p(t) + s(t) <= p(rect) + thr).sort((a, b) => p(b) + s(b) - (p(a) + s(a)))
  const after = mates.filter((t) => p(t) >= p(rect) + s(rect) - thr).sort((a, b) => p(a) - p(b))
  const L = before[0]
  const L2 = L ? before.find((t) => t !== L && p(t) + s(t) <= p(L) + 0.01) : undefined
  const R = after[0]
  const R2 = R ? after.find((t) => t !== R && p(t) >= p(R) + s(R) - 0.01) : undefined
  const out: Cand[] = []
  const mid = (r: Rect) => cp(r) + cs(r) / 2

  if (L && R) {
    const space = p(R) - (p(L) + s(L)) - s(rect)
    if (space >= 0) {
      const want = p(L) + s(L) + space / 2
      out.push({ delta: want - p(rect), rank: 1, make: (r) => [seg(p(L) + s(L), p(r), mid(r)), seg(p(r) + s(r), p(R), mid(r))] })
    }
  }
  if (L && L2) {
    const g = p(L) - (p(L2) + s(L2))
    if (g >= 0)
      out.push({ delta: p(L) + s(L) + g - p(rect), rank: 1, make: (r) => [seg(p(L2) + s(L2), p(L), mid(L)), seg(p(L) + s(L), p(r), mid(r))] })
  }
  if (R && R2) {
    const g = p(R2) - (p(R) + s(R))
    if (g >= 0)
      out.push({ delta: p(R) - g - s(rect) - p(rect), rank: 1, make: (r) => [seg(p(R) + s(R), p(R2), mid(R)), seg(p(r) + s(r), p(R), mid(r))] })
  }
  return out.filter((c) => Math.abs(c.delta) <= thr)
}

/**
 * Snap `rect` (an item being moved or placed) to the same-type items in `items`. Returns the snapped top-left and the
 * guides to draw. Alignment snaps edges and centres to edges and centres; spacing snaps to equal gaps.
 */
export function snapRect(
  items: Placed[],
  excludeId: string | null,
  type: Placed['type'],
  rect: Rect,
  thr = SNAP,
): { x: number; y: number; guides: Guide[] } {
  const others = items.filter((o) => o.id !== excludeId && o.type === type).map(footprint)
  if (!others.length) return { x: rect.x, y: rect.y, guides: [] }

  const xs: Cand[] = []
  const ys: Cand[] = []
  for (const t of others) {
    const mx = lines3(rect.x, rect.w)
    const tx = lines3(t.x, t.w)
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const mine = mx[i]
        const theirs = tx[j]
        if (Math.abs(theirs - mine) <= thr)
          xs.push({
            delta: theirs - mine,
            rank: lineRank(i, j),
            make: (r) => [{ x1: theirs, x2: theirs, y1: Math.min(r.y, t.y), y2: Math.max(r.y + r.h, t.y + t.h), kind: 'align' }],
          })
      }
    const my = lines3(rect.y, rect.h)
    const ty = lines3(t.y, t.h)
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const mine = my[i]
        const theirs = ty[j]
        if (Math.abs(theirs - mine) <= thr)
          ys.push({
            delta: theirs - mine,
            rank: lineRank(i, j),
            make: (r) => [{ y1: theirs, y2: theirs, x1: Math.min(r.x, t.x), x2: Math.max(r.x + r.w, t.x + t.w), kind: 'align' }],
          })
      }
  }
  xs.push(...gapCands('x', rect, others, thr))
  ys.push(...gapCands('y', rect, others, thr))

  const best = (c: Cand[]) =>
    c.reduce<Cand | null>((b, x) => {
      if (!b) return x
      const dx = Math.abs(x.delta)
      const db = Math.abs(b.delta)
      return dx < db - 0.005 || (Math.abs(dx - db) <= 0.005 && x.rank < b.rank) ? x : b
    }, null)
  const bx = best(xs)
  const by = best(ys)
  const dx = bx?.delta ?? 0
  const dy = by?.delta ?? 0
  const final: Rect = { x: rect.x + dx, y: rect.y + dy, w: rect.w, h: rect.h }
  const guides = [
    ...(bx ? xs.filter((c) => near(c.delta, bx.delta)).flatMap((c) => c.make(final)) : []),
    ...(by ? ys.filter((c) => near(c.delta, by.delta)).flatMap((c) => c.make(final)) : []),
  ]
  return { x: final.x, y: final.y, guides: mergeGuides(guides) }
}

/**
 * Snap the right/bottom edge being dragged on a resizable item: to edges and centres of same-type items, or to their
 * width/height (so lanes of the same kind end up the same size).
 */
export function snapSize(
  items: Placed[],
  excludeId: string,
  type: Placed['type'],
  rect: Rect,
  edges: { x: boolean; y: boolean },
  thr = SNAP,
): { w: number; h: number; guides: Guide[] } {
  const others = items.filter((o) => o.id !== excludeId && o.type === type).map(footprint)
  let w = rect.w
  let h = rect.h
  const guides: Guide[] = []
  const pick = (edge: number, size: number, ls: (t: Rect) => number[], sz: (t: Rect) => number) => {
    let best: { d: number; line?: number } | null = null
    for (const t of others) {
      for (const l of ls(t)) if (Math.abs(l - edge) <= thr && (!best || Math.abs(l - edge) < Math.abs(best.d))) best = { d: l - edge, line: l }
      const ws = sz(t)
      if (Math.abs(ws - size) <= thr && (!best || Math.abs(ws - size) < Math.abs(best.d))) best = { d: ws - size }
    }
    return best
  }
  if (edges.x) {
    const b = pick(rect.x + rect.w, rect.w, (t) => lines3(t.x, t.w), (t) => t.w)
    if (b) {
      w = rect.w + b.d
      if (b.line !== undefined) guides.push({ x1: b.line, x2: b.line, y1: Math.min(rect.y, ...others.map((t) => t.y)), y2: Math.max(rect.y + rect.h, ...others.map((t) => t.y + t.h)), kind: 'align' })
    }
  }
  if (edges.y) {
    const b = pick(rect.y + rect.h, rect.h, (t) => lines3(t.y, t.h), (t) => t.h)
    if (b) {
      h = rect.h + b.d
      if (b.line !== undefined) guides.push({ y1: b.line, y2: b.line, x1: Math.min(rect.x, ...others.map((t) => t.x)), x2: Math.max(rect.x + rect.w, ...others.map((t) => t.x + t.w)), kind: 'align' })
    }
  }
  return { w, h, guides: mergeGuides(guides) }
}
