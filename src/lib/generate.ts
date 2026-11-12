import { EXERCISES, type Exercise, type Need, compatible, exerciseById } from '#/lib/exercises'
import { type Inventory, ownedOf, readInventory, totalOf } from '#/lib/inventory'
import { type SectionDef, type StationDef, type Template, fmtTime, interval, intoFactor, sectionSeconds } from '#/lib/templates'
import type { Focus, Notes } from '#/lib/workouts'

/**
 * Fills a template's stations with exercises, at random but within the rules: each exercise fits the slot's
 * equipment, floor and kind, the focus is respected, nothing repeats, and the gym's limits hold (kettlebells for 8
 * people, dumbbells for 16, 4 barbells, plates only when no barbell is used; the counts come from Settings). Picks can be locked, so a "reroll"
 * keeps what you like. Anything can be overridden by hand.
 */

export type Pick = {
  /** Library exercise, or null for a hand-typed one. */
  exerciseId: string | null
  name: string
  dose: string
  sides: boolean
  /** Kept when rerolling. */
  locked: boolean
}

/** Station id to its movements. */
export type Picks = Record<string, Pick[]>

/** Small seedable random number generator (mulberry32), so "shuffle" is repeatable. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const pickOf = (e: Exercise, locked = false): Pick => ({ exerciseId: e.id, name: e.name, dose: e.dose, sides: !!e.sides, locked })
export const customPick = (name: string, dose = ''): Pick => ({ exerciseId: null, name, dose, sides: false, locked: true })
const BLANK: Pick = { exerciseId: null, name: '—', dose: '', sides: false, locked: false }

const stationsOf = (t: Template) => t.sections.flatMap((s) => s.stations)
const focusFor = (f: Focus | null) => f

/** Exercises that could go in one movement slot of `st`. */
export function optionsFor(t: Template, st: StationDef, focus: Focus | null): Exercise[] {
  const cap = capacityOf(readInventory())
  return EXERCISES.filter((e) =>
    e.needs.every((n) => (cap[n] ?? 1) > 0) &&
    compatible(e, { kind: st.kind, needs: st.needs, space: st.space, focus: focusFor(focus), outside: t.type === 'hyrox-outside' }),
  )
}

/** What the gym owns, as limits per need. Free weights count pieces; machines one per person; benches, boxes, mats and sleds one per two. */
type Capacity = Partial<Record<Need, number>>
function capacityOf(inv: Inventory): Capacity {
  return {
    kb: totalOf(inv.kettlebells),
    db: totalOf(inv.dumbbells),
    barbell: 4,
    plate: 8,
    bench: ownedOf(inv, 'bench'),
    plyo: ownedOf(inv, 'plyo'),
    mat: ownedOf(inv, 'softmat'),
    rowerg: ownedOf(inv, 'rowerg'),
    skierg: ownedOf(inv, 'skierg'),
    bikeerg: ownedOf(inv, 'bikeerg'),
    echo: ownedOf(inv, 'echo-bike'),
    runner: ownedOf(inv, 'runner'),
    sled: ownedOf(inv, 'sled'),
  }
}
const SHARED: Need[] = ['bench', 'plyo', 'mat', 'sled'] // partners share one (sleds take turns)
const BAYS: Need = 'barbell' // two people share a bay

type Usage = Partial<Record<Need, number>>
const MACHINES: Need[] = ['rowerg', 'skierg', 'bikeerg', 'echo', 'runner']
/** Units of `n` a station of `spots` people occupies. A group bigger than the machines there are takes turns on them. */
const unitsFor = (n: Need, spots: number, cap: Capacity) =>
  n === BAYS || SHARED.includes(n) ? Math.ceil(spots / 2) : MACHINES.includes(n) ? Math.min(spots, cap[n] ?? spots) : spots

function addUsage(u: Usage, e: Exercise, spots: number, cap: Capacity) {
  for (const n of e.needs) u[n] = (u[n] ?? 0) + unitsFor(n, spots, cap)
}

/** Does the gym have enough of what `e` needs, given what the rest of the workout already uses? */
function fits(e: Exercise, spots: number, u: Usage, cap: Capacity): boolean {
  for (const n of e.needs) {
    const limit = cap[n]
    if (limit !== undefined && (u[n] ?? 0) + unitsFor(n, spots, cap) > limit) return false
  }
  if (e.needs.includes('barbell') && (u.plate ?? 0) > 0) return false
  if (e.needs.includes('plate') && (u.barbell ?? 0) > 0) return false // plates live on the barbells
  return true
}

/**
 * Fill every unlocked slot. Locked picks stay (and still count toward the limits). `avoid` names are skipped
 * (used by reroll so a slot changes). Returns new picks for every station.
 */
export function generate(t: Template, focus: Focus | null, seed: number, prev: Picks | null = null, avoid: string[] = []): Picks {
  // Picking at random can paint itself into a corner when equipment is scarce (e.g. 4 people each need a machine and
  // the zones all grabbed the same type): try again with another seed before leaving a slot empty.
  let best: Picks = {}
  for (let attempt = 0; attempt < 40; attempt++) {
    best = generateOnce(t, focus, seed + attempt * 7919, prev, avoid)
    if (!Object.values(best).some((ps) => ps.some((p) => p === BLANK))) break
  }
  return best
}

function generateOnce(t: Template, focus: Focus | null, seed: number, prev: Picks | null, avoid: string[]): Picks {
  const rand = rng(seed)
  const cap = capacityOf(readInventory())
  const usage: Usage = {}
  const used = new Set<string>(avoid)
  const out: Picks = {}

  // pass 1: keep locked picks and count what they use
  for (const st of stationsOf(t)) {
    out[st.id] = Array.from({ length: st.movements }, (_, i) => {
      const p = prev?.[st.id]?.[i]
      if (p?.locked) {
        const e = p.exerciseId ? exerciseById(p.exerciseId) : undefined
        if (e) addUsage(usage, e, st.spots, cap)
        used.add(p.name)
        return p
      }
      return BLANK
    })
  }
  // pass 2: fill the rest at random
  for (const st of stationsOf(t)) {
    out[st.id] = out[st.id].map((p, i) => {
      if (prev?.[st.id]?.[i]?.locked) return p
      const all = optionsFor(t, st, focus)
      const fresh = all.filter((e) => !used.has(e.name) && fits(e, st.spots, usage, cap))
      const pool = fresh.length ? fresh : all.filter((e) => fits(e, st.spots, usage, cap))
      if (!pool.length) return BLANK
      const e = pool[Math.floor(rand() * pool.length)]
      addUsage(usage, e, st.spots, cap)
      used.add(e.name)
      return pickOf(e)
    })
  }
  return out
}

/** Reroll a single movement: everything else stays, this slot gets a different exercise. */
export function rerollOne(t: Template, focus: Focus | null, seed: number, picks: Picks, stationId: string, index: number): Picks {
  const current = picks[stationId]?.[index]
  const keep: Picks = Object.fromEntries(
    Object.entries(picks).map(([id, ps]) => [id, ps.map((p, i) => (id === stationId && i === index ? { ...p, locked: false } : { ...p, locked: true }))]),
  )
  const next = generate(t, focus, seed, keep, current ? [current.name] : [])
  // restore the original lock flags on everything but the rerolled slot
  return Object.fromEntries(
    Object.entries(next).map(([id, ps]) => [id, ps.map((p, i) => (id === stationId && i === index ? p : { ...p, locked: picks[id]?.[i]?.locked ?? false }))]),
  )
}

/* ------------------------------ text ------------------------------ */

const sidesOf = (p: Pick, dose: string) => (p.sides && !/L\|R/.test(dose) ? ' L|R' : '')
/** "KB SWING 15", "BULGARIAN SPLIT SQUAT 8 L|R", "SKIERG 250 M". */
export const movementText = (p: Pick) => (p.dose ? `${p.name} ${p.dose}${sidesOf(p, p.dose)}` : `${p.name}${sidesOf(p, '')}`)
/** Just the amount, for station titles: "250 M", "8 L|R". */
const doseText = (p: Pick) => (p.dose ? `${p.dose}${sidesOf(p, p.dose)}` : '')

const restText = (r: SectionDef['rotation']) => (r.rest > 0 ? `${fmtTime(r.rest)} REST` : 'NO REST')
const work = (r: SectionDef['rotation']) => `${fmtTime(r.work)} WORK / ${restText(r)}`

function sectionText(s: SectionDef, picks: Picks): string {
  const r = s.rotation
  const f = intoFactor(s.stations)
  const iv = interval(r, f)
  const total = sectionSeconds(r, s.stations.length, f)
  const moves = (st: StationDef) => (picks[st.id] ?? []).map(movementText)
  const lines: string[] = []

  if (r.style === 'into') {
    lines.push(`${fmtTime(total)} · ${fmtTime(r.rounds * iv)} + ${fmtTime(r.rounds * iv)} · ${fmtTime(r.move)} SWAP + REST`, '')
    s.stations.forEach((st, i) => {
      if (i > 0) lines.push('INTO')
      const ms = moves(st)
      // a 1-movement station beside a 2-movement one holds its movement for double the work time
      const w = ms.length >= 2 ? r.work : r.work * f
      lines.push(`${r.rounds} x ${fmtTime(iv)} · ${fmtTime(w)} WORK${ms.length >= 2 ? ' EACH' : ''} / ${restText(r)}`, ...ms)
    })
  } else if (r.style === 'alternate') {
    lines.push(`${fmtTime(total)} · ${r.rounds} x ${fmtTime(iv)} + ${fmtTime(r.move)} SWAP + REST`, '')
    lines.push(`${r.rounds} x ${fmtTime(iv)} · PARTNERS ALTERNATE`, `${work(r)} EACH`)
    s.stations.forEach((st) => lines.push(...moves(st)))
  } else if (r.style === 'rotate') {
    lines.push(`${s.stations.length} STATIONS · ${fmtTime(r.rounds * iv)} + ${fmtTime(r.move)} SWAP + REST · ROTATE CLOCKWISE`)
    s.stations.forEach((st, i) => {
      const ps = picks[st.id] ?? []
      const doses = ps.map(doseText).filter(Boolean)
      lines.push('', `${i + 1} ${ps.map((p) => p.name).join(' + ')}`, `${r.rounds} x ${fmtTime(iv)} · ${work(r)}`)
      if (doses.length) lines.push(doses.join(' + '))
    })
  } else {
    lines.push(`${fmtTime(total)} · ${r.rounds}x · ${fmtTime(iv)} PER STATION (${work(r)}) + ${fmtTime(r.move)} SWAP + REST`, '')
    s.stations.forEach((st, i) => lines.push(`${i + 1} ${moves(st).join(' + ')}`))
  }
  return lines.join('\n')
}

/** The workout text for every field of the workout type, in the gym's house style. */
export function buildNotes(t: Template, picks: Picks): Notes {
  return Object.fromEntries(t.sections.map((s) => [s.key, sectionText(s, picks)]))
}
