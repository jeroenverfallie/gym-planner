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

/** Overlaps smaller than this (metres) are ignored: the grid snaps in 0.5 m steps, machines aren't that tidy. */
const TOL = 0.05

const overlaps = (a: Rect, b: Rect, tol = TOL) =>
  a.x < b.x + b.w - tol && b.x < a.x + a.w - tol && a.y < b.y + b.h - tol && b.y < a.y + a.h - tol

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
 * An item is in conflict only if it overlaps the rack's solid parts (barbell bays and pull pillars;
 * the pull-up bays are open) or another item. Exception: an upright RowErg may stand on a SkiErg's
 * base (each SkiErg carries at most RIDERS_PER_BASE). Dead space doesn't cause conflicts.
 */
export function hasConflict(item: Placed, others: Placed[]): boolean {
  const r = footprint(item)

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
