import {
  BLK_BOX_RACK,
  WALL_BALL_TARGETS,
  type Placed,
  footprint,
  rackSafeRects,
  safeRect,
  typeOf,
  wallBallSafeRects,
} from '#/lib/equipment'
import { COLS, HEIGHT_M, ROWS, WIDTH_M, ZONES, type Floor } from '#/lib/floor'

/** Fixed floor colours (same in light and dark mode), matching the planner. */
const TILE = '#232326'
const TURF = '#0c0c0d'
const DEAD = '#8d8d92'
const SAFE = 'rgb(90 209 122 / .22)'
const RACK_COLORS = { barbell: '#f2a62b', pull: '#35b8a8', pullup: '#9a8cf5' } as const

/** Horizontal runs of cells of one kind, as [x, y, length] in metres. */
function runs(match: (i: number) => boolean) {
  const out: { x: number; y: number; w: number }[] = []
  for (let r = 0; r < ROWS; r++) {
    let start = -1
    for (let c = 0; c <= COLS; c++) {
      const on = c < COLS && match(r * COLS + c)
      if (on && start < 0) start = c
      if (!on && start >= 0) {
        out.push({ x: start / 2, y: r / 2, w: (c - start) / 2 })
        start = -1
      }
    }
  }
  return out
}

/** Draw order: things that stand on others last, so they stay visible. */
const byLayer = (items: Placed[]) =>
  [...items].sort((a, b) => Number(!!typeOf(a.type).restsOn) - Number(!!typeOf(b.type).restsOn))

/**
 * A small, read-only picture of a saved floor plan: surfaces and dead space, the rig (with the stations in use
 * outlined), the wall ball targets, safe areas of what's in use, and the equipment (stored items faded).
 */
export function MiniPlan({ floor, title }: { floor: Floor; title?: string }) {
  const turf = runs((i) => floor.surface[i] === 'turf')
  const dead = runs((i) => floor.cells[i] === 'dead')
  const rig = new Set(floor.active.rig)

  const safe = [
    ...floor.items.filter((i) => !i.stored && !typeOf(i.type).marker).map(safeRect),
    ...rackSafeRects(BLK_BOX_RACK, floor.active.rig),
    ...(floor.active.wallBalls ? wallBallSafeRects() : []),
  ]

  let rackX = BLK_BOX_RACK.x

  return (
    <svg
      className="mini-plan"
      viewBox={`0 0 ${WIDTH_M} ${HEIGHT_M}`}
      role="img"
      aria-label={title ?? 'Floor plan'}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width={WIDTH_M} height={HEIGHT_M} fill={TILE} />
      {turf.map((r, i) => (
        <rect key={`t${i}`} x={r.x} y={r.y} width={r.w} height={0.5} fill={TURF} />
      ))}
      {dead.map((r, i) => (
        <rect key={`d${i}`} x={r.x} y={r.y} width={r.w} height={0.5} fill={DEAD} />
      ))}
      {ZONES.slice(1).map((z) => (
        <line key={z.id} x1={0} x2={WIDTH_M} y1={z.y0} y2={z.y0} stroke="#fff" strokeOpacity={0.22} strokeWidth={0.05} strokeDasharray="0.25 0.2" />
      ))}

      {safe.map((r, i) => (
        <rect key={`s${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={SAFE} />
      ))}

      {BLK_BOX_RACK.parts.map((p, i) => {
        const x = rackX
        rackX += p.width
        return (
          <rect
            key={`r${i}`}
            x={x}
            y={BLK_BOX_RACK.y}
            width={p.width}
            height={BLK_BOX_RACK.height}
            fill={RACK_COLORS[p.kind]}
            stroke={rig.has(i) ? '#fff' : 'rgb(0 0 0 / .5)'}
            strokeWidth={rig.has(i) ? 0.1 : 0.03}
          />
        )
      })}

      {WALL_BALL_TARGETS.map((t) => (
        <rect
          key={t.id}
          x={t.x}
          y={t.y}
          width={t.width}
          height={t.height}
          fill="#fff"
          fillOpacity={floor.active.wallBalls ? 0.7 : 0.3}
          stroke="#fff"
          strokeWidth={0.05}
          strokeDasharray="0.15 0.1"
        />
      ))}

      {byLayer(floor.items).map((it) => {
        const t = typeOf(it.type)
        const r = footprint(it)
        if (t.marker)
          return (
            <rect
              key={it.id}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill="#fff"
              fillOpacity={0.1}
              stroke="#fff"
              strokeWidth={0.07}
              strokeDasharray="0.25 0.15"
            />
          )
        return (
          <rect
            key={it.id}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={t.color}
            fillOpacity={it.stored ? 0.3 : 1}
            stroke="rgb(0 0 0 / .6)"
            strokeWidth={0.04}
          />
        )
      })}

      <rect width={WIDTH_M} height={HEIGHT_M} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={0.1} />
    </svg>
  )
}
