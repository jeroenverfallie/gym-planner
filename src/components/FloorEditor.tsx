import {
  EQUIPMENT_TYPES,
  FIXED_EQUIPMENT,
  STATION_KINDS,
  WALL_BALL_TARGETS,
  rackExclusions,
  rackPartAt,
  rackPartsOfKind,
  rackSafeRects,
  type StationKind,
  safeRect,
  wallBallSafeRects,
  type EquipmentTypeId,
  type Placed,
  countStations,
  footprint,
  isPermanent,
  sizeOf,
  typeOf,
} from '#/lib/equipment'
import { defaultFloor, restoreMissing } from '#/lib/default-floor'
import { hasConflict, restingOn, safetyWarnings, snapToStack, stackSize } from '#/lib/placement'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FOCUSES,
  WORKOUT_TYPES,
  type Focus,
  type Workout,
  type WorkoutType,
  newWorkoutId,
  noteFields,
  planOf,
  readWorkouts,
  typeInfo,
  upsertWorkout,
} from '#/lib/workouts'
import {
  type Brush,
  type Floor,
  type Point,
  CELL_AREA,
  COLS,
  HEIGHT_M,
  ROWS,
  SUB,
  WIDTH_M,
  countDead,
  countTurf,
  deserialize,
  expand,
  linePoints,
  oppositeBrush,
  paint,
  rectPoints,
  sameCells,
  serialize,
  ZONES,
} from '#/lib/floor'

type Shape = 'brush' | 'line' | 'rect'
type Tool = 'draw' | 'equip'
/** Marking resolution in stored cells: 2 = 1 m, 1 = 0.5 m. */
type Step = 1 | 2
type Metres = { x: number; y: number }

// v2: current save format (v1 saves are ignored).
const NOTES_KEY = 'joeys:workout-notes:v1'
const META_KEY = 'joeys:current-workout:v1'

type Meta = { id: string | null; name: string; type: WorkoutType; focus: Focus }
const EMPTY_META: Meta = { id: null, name: '', type: 'lift', focus: 'lower' }
const STORAGE_KEY = 'joeys:floor:v2'

const SHAPES: { id: Shape; label: string; key: string }[] = [
  { id: 'brush', label: 'Brush', key: 'B' },
  { id: 'line', label: 'Line', key: 'L' },
  { id: 'rect', label: 'Rectangle', key: 'R' },
]

const BRUSHES: { id: Brush; label: string; key: string }[] = [
  { id: 'dead', label: 'Dead', key: 'X' },
  { id: 'open', label: 'Erase', key: 'X' },
  { id: 'turf', label: 'Turf', key: 'U' },
  { id: 'tile', label: 'Tile', key: 'T' },
]

const RIG_KINDS: { kind: StationKind; label: string }[] = [
  { kind: 'barbell', label: 'Barbells' },
  { kind: 'pull', label: 'Pulls' },
  { kind: 'pullup', label: 'Pull-ups' },
]

/** Workout spaces are markers, not equipment: they don't count toward the equipment totals. */
const TOTAL_EQUIPMENT = EQUIPMENT_TYPES.filter((t) => !t.marker).reduce((n, t) => n + t.count, 0)

const rowLabel = (r: number) => String.fromCharCode(65 + r)
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
const pct = (v: number, of: number) => `${(v / of) * 100}%`
const newId = (type: string) => `${type}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** Items that stand on others (RowErgs) go last: drawn on top and picked first. */
const byLayer = (items: Placed[]) =>
  [...items].sort((a, b) => Number(!!typeOf(a.type).restsOn) - Number(!!typeOf(b.type).restsOn))

const toCm = (v: number) => Math.round(v * 100) / 100
/** Keep a w × h rect inside the room. Equipment isn't snapped: it lands exactly where it's dropped (to the cm). */
const clampPos = (x: number, y: number, w: number, h: number) => ({
  x: toCm(Math.min(WIDTH_M - w, Math.max(0, x))),
  y: toCm(Math.min(HEIGHT_M - h, Math.max(0, y))),
})

export function FloorEditor({ loadId }: { loadId?: string }) {
  const navigate = useNavigate()
  const [floor, setFloor] = useState<Floor>(() => defaultFloor())
  const [past, setPast] = useState<Floor[]>([])
  const [future, setFuture] = useState<Floor[]>([])
  const [draft, setDraft] = useState<Floor | null>(null)
  const [tool, setTool] = useState<Tool>('draw')
  const [shape, setShape] = useState<Shape>('brush')
  const [value, setValue] = useState<Brush>('dead')
  const [step, setStep] = useState<Step>(SUB) // default: whole metres
  const [hover, setHover] = useState<Point | null>(null) // draw tool, in `step` units
  const [hoverM, setHoverM] = useState<Metres | null>(null) // equipment tool, metres
  const [armed, setArmed] = useState<EquipmentTypeId | null>(null) // type about to be placed
  const [armedRotated, setArmedRotated] = useState(false)
  const [armedUpright, setArmedUpright] = useState(false)
  const [armedStored, setArmedStored] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  // The workout text for each zone, typed in the notes column beside the plan.
  const [notes, setNotes] = useState<Record<string, string>>({})
  // The workout being edited (id once it has been saved to the catalogue), and a short confirmation message.
  const [meta, setMeta] = useState<Meta>(EMPTY_META)
  const [flash, setFlash] = useState('')

  const gridRef = useRef<HTMLDivElement>(null)
  // Stroke/drag state live in refs: they change on every pointer move and must not trigger renders themselves.
  // Stroke points are in `step` units; `step` is frozen for the stroke.
  const stroke = useRef<{ start: Point; last: Point; base: Floor; value: Brush; step: Step } | null>(null)
  const drag = useRef<{ id: string; base: Floor; dx: number; dy: number } | null>(null)

  /* ---- persistence (client only, so SSR markup stays stable) ---- */
  useEffect(() => {
    // Opened from the catalogue (?workout=id): load that workout instead of the autosaved one.
    const w = loadId ? readWorkouts().find((x) => x.id === loadId) : undefined
    const wf = w ? planOf(w) : null
    if (w && wf) {
      setFloor({ ...wf, items: restoreMissing(wf.items) })
      setNotes({ ...w.notes })
      setMeta({ id: w.id, name: w.name, type: w.type, focus: w.focus ?? 'lower' })
    } else {
      const saved = deserialize(localStorage.getItem(STORAGE_KEY), defaultFloor().surface)
      if (saved) setFloor({ ...saved, items: restoreMissing(saved.items) })
      try {
        const n = JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}')
        if (n && typeof n === 'object') setNotes(n)
        const m = JSON.parse(localStorage.getItem(META_KEY) ?? 'null')
        if (m && typeof m.name === 'string') setMeta({ ...EMPTY_META, ...m })
      } catch {
        /* ignore unreadable notes */
      }
    }
    if (loadId) navigate({ to: '/', search: {}, replace: true }) // the id has been used: keep reloads clean
    setLoaded(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (loaded) localStorage.setItem(META_KEY, JSON.stringify(meta))
  }, [meta, loaded])
  useEffect(() => {
    if (loaded) localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  }, [notes, loaded])
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, serialize(floor))
  }, [floor, loaded])

  /* ---- history ---- */
  const commit = useCallback(
    (next: Floor) => {
      if (sameCells(floor, next)) return
      setPast((p) => [...p, floor])
      setFuture([])
      setFloor(next)
    },
    [floor],
  )
  const undo = useCallback(() => {
    if (!past.length) return
    setFuture((f) => [floor, ...f])
    setFloor(past[past.length - 1])
    setPast(past.slice(0, -1))
  }, [floor, past])
  const redo = useCallback(() => {
    if (!future.length) return
    setPast((p) => [...p, floor])
    setFloor(future[0])
    setFuture(future.slice(1))
  }, [floor, future])
  const resetDefault = () => commit(defaultFloor())
  const toggleWallBalls = () => commit({ ...floor, active: { ...floor.active, wallBalls: !floor.active.wallBalls } })
  const setRig = (rig: number[]) => commit({ ...floor, active: { ...floor.active, rig: [...new Set(rig)].sort((a, b) => a - b) } })
  /** Switching a station on switches off the ones it can't share the rack with (barbell bay vs its pillars). */
  const withStations = (rig: number[], on: number[]) => {
    const clash = new Set(on.flatMap((i) => rackExclusions(i)))
    return [...rig.filter((p) => !clash.has(p)), ...on]
  }
  const toggleRigPart = (i: number) =>
    setRig(floor.active.rig.includes(i) ? floor.active.rig.filter((p) => p !== i) : withStations(floor.active.rig, [i]))
  /** Switch every station of one kind on, or all off if they're all on already. */
  const toggleRigKind = (kind: StationKind) => {
    const idx = rackPartsOfKind(kind)
    const allOn = idx.every((i) => floor.active.rig.includes(i))
    setRig(allOn ? floor.active.rig.filter((i) => !idx.includes(i)) : withStations(floor.active.rig, idx))
  }
  /* ---- the workout catalogue ---- */
  const say = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(''), 2500)
  }
  const saveWorkout = (asNew: boolean) => {
    const name = meta.name.trim()
    if (!name) return
    const isNew = asNew || !meta.id
    const w: Workout = {
      id: isNew ? newWorkoutId() : meta.id!,
      name,
      type: meta.type,
      focus: typeInfo(meta.type).hasFocus ? meta.focus : null,
      notes: Object.fromEntries(Object.entries(notes).filter(([, v]) => typeof v === 'string')),
      plan: serialize(floor),
      savedAt: Date.now(),
    }
    upsertWorkout(w)
    setMeta((m) => ({ ...m, id: w.id, name }))
    say(isNew ? 'Saved to the catalogue' : 'Workout updated')
  }
  const newWorkout = () => {
    const dirty = !sameCells(floor, defaultFloor()) || Object.values(notes).some(Boolean) || !!meta.name
    if (dirty && !window.confirm('Start a new workout? Unsaved changes to the current one will be lost.')) return
    setFloor(defaultFloor())
    setPast([])
    setFuture([])
    setNotes({})
    setMeta(EMPTY_META)
    setSelectedId(null)
    setArmed(null)
  }
  const clearAll = () => commit(paint(floor, rectPoints({ col: 0, row: 0 }, { col: COLS - 1, row: ROWS - 1 }), 'open')) // dead space only; surfaces stay
  const fillAll = () => commit(paint(floor, rectPoints({ col: 0, row: 0 }, { col: COLS - 1, row: ROWS - 1 }), 'dead'))

  /* ---- equipment actions ---- */
  const rotateSelected = () => {
    const it = floor.items.find((i) => i.id === selectedId)
    if (!it) return setArmedRotated((r) => !r)
    const next = { ...it, rotated: !it.rotated }
    const { w, h } = footprint(next)
    Object.assign(next, clampPos(it.x, it.y, w, h))
    commit({ ...floor, items: floor.items.map((i) => (i.id === it.id ? next : i)) })
  }
  const selected = floor.items.find((i) => i.id === selectedId)
  /** Type whose upright setting the Upright button/key currently acts on (selected item, else the armed type). */
  const uprightType = selected ? selected.type : armed
  const canUpright = !!uprightType && !!typeOf(uprightType).upright
  const isUpright = selected ? !!selected.upright : armedUpright
  const toggleUpright = () => {
    if (!canUpright) return
    if (!selected) return setArmedUpright((u) => !u)
    const next = { ...selected, upright: !selected.upright }
    const { w, h } = footprint(next)
    Object.assign(next, clampPos(selected.x, selected.y, w, h))
    commit({ ...floor, items: floor.items.map((i) => (i.id === selected.id ? next : i)) })
  }
  const isStoredMark = selected ? !!selected.stored : armedStored
  const toggleStored = () => {
    if (!selected) return armed ? setArmedStored((v) => !v) : undefined
    commit({ ...floor, items: floor.items.map((i) => (i.id === selected.id ? { ...i, stored: !i.stored } : i)) })
  }
  const removeSelected = () => {
    // Permanent equipment (everything but benches, soft mats and workout spaces) has to be somewhere: never deletable.
    if (!selectedId || (selected && isPermanent(selected.type))) return
    commit({ ...floor, items: floor.items.filter((i) => i.id !== selectedId) })
    setSelectedId(null)
  }
  const removeAllEquipment = () => {
    commit({ ...floor, items: floor.items.filter((i) => isPermanent(i.type)) })
    setSelectedId(null)
  }
  const armType = (id: EquipmentTypeId) => {
    setTool('equip')
    setSelectedId(null)
    setArmedRotated(false) // every pick starts horizontal; press R to turn it
    setArmedUpright(false) // ...and flat; press U for upright
    setArmedStored(false) // ...and in use; press S to place it as stored
    setArmed((a) => (a === id ? null : id))
  }

  /* ---- keyboard shortcuts (handler kept in a ref so it always sees fresh state) ---- */
  const onKeyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  onKeyRef.current = (e) => {
    // Typing in a notes box must not trigger tool shortcuts (or undo of the plan).
    const t = e.target as HTMLElement | null
    if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.isContentEditable)) return
    const mod = e.metaKey || e.ctrlKey
    const k = e.key.toLowerCase()
    if (mod && k === 'z') {
      e.preventDefault()
      e.shiftKey ? redo() : undo()
    } else if (mod && k === 'y') {
      e.preventDefault()
      redo()
    } else if (!mod && !e.altKey) {
      if (k === 'd') setTool('draw')
      else if (k === 'e') setTool('equip')
      else if (k === 'g') setStep((s) => (s === SUB ? 1 : SUB))
      else if (k === 'escape') {
        setArmed(null)
        setSelectedId(null)
      } else if (tool === 'equip') {
        if (k === 'r') rotateSelected()
        else if (k === 'u') toggleUpright()
        else if (k === 's') toggleStored()
        else if (k === 'backspace' || k === 'delete') {
          e.preventDefault()
          removeSelected()
        }
      } else {
        if (k === 'b') setShape('brush')
        else if (k === 'l') setShape('line')
        else if (k === 'r') setShape('rect')
        else if (k === 'x') setValue((v) => (v === 'dead' ? 'open' : 'dead'))
        else if (k === 'u') setValue('turf')
        else if (k === 't') setValue('tile')
      }
    }
  }
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKeyRef.current(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  /* ---- pointer handling ---- */
  const metres = (e: React.PointerEvent): Metres => {
    const r = gridRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * WIDTH_M, y: ((e.clientY - r.top) / r.height) * HEIGHT_M }
  }

  const cellAt = (e: React.PointerEvent, st: Step): Point => {
    const r = gridRef.current!.getBoundingClientRect()
    const cols = COLS / st
    const rows = ROWS / st
    const clamp = (n: number, max: number) => Math.min(max - 1, Math.max(0, n))
    return {
      col: clamp(Math.floor(((e.clientX - r.left) / r.width) * cols), cols),
      row: clamp(Math.floor(((e.clientY - r.top) / r.height) * rows), rows),
    }
  }

  /** Where an armed item lands when the pointer is at `m` (centred on the pointer, inside the room). */
  const placementAt = (m: Metres, type: EquipmentTypeId, rotated: boolean, upright: boolean) => {
    const { w, h } = sizeOf(type, rotated, upright)
    const pos = clampPos(m.x - w / 2, m.y - h / 2, w, h)
    // Stackable types (plyo boxes) snap onto an overlapped unit of the same type.
    return snapToStack(floor.items, null, { id: 'probe', type, rotated, upright, ...pos })
  }

  const equipDown = (e: React.PointerEvent) => {
    const m = metres(e)
    const hit = byLayer(floor.items).reverse().find((it) => {
      const r = footprint(it)
      return m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h
    })
    const placedOfArmed = armed ? floor.items.filter((i) => i.type === armed).length : 0
    // An armed type always places, even over existing items (that's how a stored RowErg ends up on a SkiErg).
    // Disarm (Esc or the chip) to select and drag existing items.
    if (armed && placedOfArmed < typeOf(armed).count) {
      const upright = armedUpright && !!typeOf(armed).upright
      const item: Placed = {
        id: newId(armed),
        type: armed,
        rotated: armedRotated,
        upright,
        stored: armedStored,
        ...placementAt(m, armed, armedRotated, upright),
      }
      commit({ ...floor, items: [...floor.items, item] })
      setSelectedId(item.id)
      if (placedOfArmed + 1 >= typeOf(armed).count) setArmed(null)
    } else if (hit) {
      setSelectedId(hit.id)
      setArmed(null)
      drag.current = { id: hit.id, base: floor, dx: m.x - hit.x, dy: m.y - hit.y }
    } else {
      const part = rackPartAt(m)
      if (part !== null) toggleRigPart(part)
      else setSelectedId(null)
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    if (tool === 'equip') return equipDown(e)
    // Hold Alt/Option to flip between marking and clearing for this stroke.
    const v: Brush = e.altKey ? oppositeBrush(value) : value
    const p = cellAt(e, step)
    stroke.current = { start: p, last: p, base: floor, value: v, step }
    setDraft(paint(floor, expand([p], step), v))
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (tool === 'equip') {
      const m = metres(e)
      setHoverM(m)
      const d = drag.current
      if (d) {
        const it = d.base.items.find((i) => i.id === d.id)!
        const { w, h } = footprint(it)
        const free = clampPos(m.x - d.dx, m.y - d.dy, w, h)
        const pos = snapToStack(d.base.items, d.id, { ...it, ...free })
        setDraft({ ...d.base, items: d.base.items.map((i) => (i.id === d.id ? { ...i, ...pos } : i)) })
      }
      return
    }
    const s = stroke.current
    const p = cellAt(e, s?.step ?? step)
    setHover((h) => (h && h.col === p.col && h.row === p.row ? h : p))
    if (!s || (p.col === s.last.col && p.row === s.last.row)) return
    const prev = s.last // capture now: the updater below runs after s.last is reassigned
    const st = s.step
    if (shape === 'brush') {
      // Interpolate so fast drags don't leave gaps.
      setDraft((d) => paint(d ?? s.base, expand(linePoints(prev, p), st), s.value))
    } else {
      const pts = shape === 'line' ? linePoints(s.start, p) : rectPoints(s.start, p)
      setDraft(paint(s.base, expand(pts, st), s.value))
    }
    s.last = p
  }

  const endStroke = () => {
    if (!stroke.current && !drag.current) return
    stroke.current = null
    drag.current = null
    if (draft) commit(draft)
    setDraft(null)
  }

  const shown = draft ?? floor
  const dead = countDead(shown)
  const deadM2 = dead * CELL_AREA
  const turfM2 = countTurf(shown) * CELL_AREA
  const spaceCount = shown.items.filter((i) => typeOf(i.type).marker).length
  const equipmentCount = shown.items.length - spaceCount
  const storedCount = shown.items.filter((i) => i.stored).length
  const totalM2 = WIDTH_M * HEIGHT_M
  const hoverStep = stroke.current?.step ?? step
  const fields = noteFields(meta.type)

  const conflictIds = useMemo(
    () => new Set(shown.items.filter((it) => hasConflict(it, shown.items)).map((i) => i.id)),
    [shown],
  )
  const warnIds = useMemo(() => safetyWarnings(shown.items, shown.active), [shown])
  const countOf = (id: EquipmentTypeId) => shown.items.filter((i) => i.type === id).length

  // Ghost preview of the armed item under the pointer.
  const ghost: Placed | null =
    tool === 'equip' && armed && hoverM && !drag.current && countOf(armed) < typeOf(armed).count
      ? {
          id: 'ghost',
          type: armed,
          rotated: armedRotated,
          upright: armedUpright && !!typeOf(armed).upright,
          stored: armedStored,
          ...placementAt(hoverM, armed, armedRotated, armedUpright && !!typeOf(armed).upright),
        }
      : null
  const ghostConflict = ghost ? hasConflict(ghost, shown.items) : false

  const rectStyle = (r: { x: number; y: number; w: number; h: number }) => ({
    left: pct(r.x, WIDTH_M),
    top: pct(r.y, HEIGHT_M),
    width: pct(r.w, WIDTH_M),
    height: pct(r.h, HEIGHT_M),
  })

  return (
    <div className="editor">
      <section className="workout-bar" aria-label="Workout">
        <input
          className="field name"
          value={meta.name}
          onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
          placeholder="Workout name"
          aria-label="Workout name"
        />
        <select
          className="field"
          value={meta.type}
          onChange={(e) => setMeta((m) => ({ ...m, type: e.target.value as WorkoutType }))}
          aria-label="Workout type"
        >
          {WORKOUT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        {typeInfo(meta.type).hasFocus && (
          <select
            className="field"
            value={meta.focus}
            onChange={(e) => setMeta((m) => ({ ...m, focus: e.target.value as Focus }))}
            aria-label="Focus"
          >
            {FOCUSES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        )}
        <button className="btn primary" onClick={() => saveWorkout(false)} disabled={!meta.name.trim()}>
          {meta.id ? 'Update workout' : 'Save workout'}
        </button>
        {meta.id && (
          <button className="btn" onClick={() => saveWorkout(true)} disabled={!meta.name.trim()}>
            Save as new
          </button>
        )}
        <button className="btn" onClick={newWorkout}>
          New
        </button>
        <span className="flash" role="status">
          {flash}
        </span>
      </section>

      <header className="toolbar">
        <div className="group" role="radiogroup" aria-label="Tool">
          <button
            role="radio"
            aria-checked={tool === 'draw'}
            className={tool === 'draw' ? 'btn active' : 'btn'}
            onClick={() => setTool('draw')}
            title="Draw floor (D)"
          >
            Draw
            <kbd>D</kbd>
          </button>
          <button
            role="radio"
            aria-checked={tool === 'equip'}
            className={tool === 'equip' ? 'btn active' : 'btn'}
            onClick={() => setTool('equip')}
            title="Place equipment (E)"
          >
            Equipment
            <kbd>E</kbd>
          </button>
        </div>

        {tool === 'draw' ? (
          <>
            <div className="group" role="radiogroup" aria-label="Shape">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  role="radio"
                  aria-checked={shape === s.id}
                  className={shape === s.id ? 'btn active' : 'btn'}
                  onClick={() => setShape(s.id)}
                  title={`${s.label} (${s.key})`}
                >
                  {s.label}
                  <kbd>{s.key}</kbd>
                </button>
              ))}
            </div>

            <div className="group" role="radiogroup" aria-label="Paint">
              {BRUSHES.map((b) => (
                <button
                  key={b.id}
                  role="radio"
                  aria-checked={value === b.id}
                  className={value === b.id ? 'btn active' : 'btn'}
                  onClick={() => setValue(b.id)}
                  title={`${b.label} (${b.key})`}
                >
                  <span className={`swatch ${b.id}`} /> {b.label}
                  <kbd>{b.key}</kbd>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="group">
            <button className="btn" onClick={rotateSelected} disabled={!selectedId && !armed} title="Rotate 90° (R)">
              Rotate<kbd>R</kbd>
            </button>
            <button
              className={isUpright && canUpright ? 'btn active' : 'btn'}
              onClick={toggleUpright}
              disabled={!canUpright}
              aria-pressed={isUpright && canUpright}
              title="Stand on end (U)"
            >
              Upright<kbd>U</kbd>
            </button>
            <button
              className={isStoredMark && (selected || armed) ? 'btn active' : 'btn'}
              onClick={toggleStored}
              disabled={!selected && !armed}
              aria-pressed={isStoredMark && !!(selected || armed)}
              title="Mark as stored: not in use, drawn dulled (S)"
            >
              Stored<kbd>S</kbd>
            </button>
            <button
              className="btn"
              onClick={removeSelected}
              disabled={!selected || isPermanent(selected.type)}
              title={selected && isPermanent(selected.type) ? 'This equipment is permanent and always stays on the plan' : 'Remove selected (⌫)'}
            >
              Remove<kbd>⌫</kbd>
            </button>
            <button
              className="btn"
              onClick={removeAllEquipment}
              disabled={!floor.items.some((i) => !isPermanent(i.type))}
              title="Removes the added benches, soft mats and workout spaces. The gym's equipment stays."
            >
              Remove all
            </button>
            {RIG_KINDS.map(({ kind, label }) => {
              const idx = rackPartsOfKind(kind)
              const on = idx.filter((i) => floor.active.rig.includes(i)).length
              return (
                <button
                  key={kind}
                  className={on === idx.length ? 'btn active' : on > 0 ? 'btn partial' : 'btn'}
                  onClick={() => toggleRigKind(kind)}
                  aria-pressed={on === idx.length}
                  title={`${label} in use (${on}/${idx.length}). Click to switch all, or click a single station on the plan.`}
                >
                  {label} {on}/{idx.length}
                </button>
              )
            })}
            <button
              className={floor.active.wallBalls ? 'btn active' : 'btn'}
              onClick={toggleWallBalls}
              aria-pressed={floor.active.wallBalls}
              title="Wall balls in use: claims the throwing space in front of the targets"
            >
              Wall balls in use
            </button>
          </div>
        )}

        <div className="group" role="radiogroup" aria-label="Precision">
          <button
            role="radio"
            aria-checked={step === SUB}
            className={step === SUB ? 'btn active' : 'btn'}
            onClick={() => setStep(SUB)}
          >
            1 m
          </button>
          <button
            role="radio"
            aria-checked={step === 1}
            className={step === 1 ? 'btn active' : 'btn'}
            onClick={() => setStep(1)}
          >
            0.5 m
          </button>
          <kbd title="Toggle precision">G</kbd>
        </div>

        <div className="group">
          <button className="btn" onClick={undo} disabled={!past.length} title="Undo (⌘Z)">
            Undo
          </button>
          <button className="btn" onClick={redo} disabled={!future.length} title="Redo (⇧⌘Z)">
            Redo
          </button>
          {tool === 'draw' && (
            <>
              <button className="btn" onClick={fillAll}>
                Fill all
              </button>
              <button className="btn" onClick={clearAll} disabled={countDead(floor) === 0}>
                Clear
              </button>
            </>
          )}
          <button className="btn" onClick={resetDefault} disabled={sameCells(floor, defaultFloor())}>
            Reset to default
          </button>
        </div>
      </header>

      <section className="palette" aria-label="Equipment">
        {EQUIPMENT_TYPES.filter((t) => !t.permanent).map((t) => {
          const n = countOf(t.id)
          return (
            <button
              key={t.id}
              className={armed === t.id ? 'chip active' : 'chip'}
              disabled={n >= t.count}
              onClick={() => armType(t.id)}
              title={`Place ${t.name}`}
            >
              <i className="chip-dot" style={{ background: t.color }} />
              <span className="chip-name">{t.name}</span>
              <small>
                {n}/{t.count} · {t.length} × {t.depth} m
              </small>
            </button>
          )
        })}
      </section>

      <div className="board">
        <div className="col-labels" aria-hidden>
          {Array.from({ length: WIDTH_M }, (_, c) => (
            <span key={c}>{c + 1}</span>
          ))}
        </div>
        <div className="row-labels" aria-hidden>
          {Array.from({ length: HEIGHT_M }, (_, r) => (
            <span key={r}>{rowLabel(r)}</span>
          ))}
        </div>
        <div
          ref={gridRef}
          className={`grid${step === 1 ? ' fine' : ''}${tool === 'equip' ? ' equip' : ''}`}
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, aspectRatio: `${WIDTH_M} / ${HEIGHT_M}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={() => {
            setHover(null)
            setHoverM(null)
          }}
        >
          {shown.cells.map((c, i) => (
            <div key={i} className={`cell ${c} ${shown.surface[i]}`} />
          ))}
          <div className="meter-lines" />
          <div className="fixed-layer" aria-hidden>
            {ZONES.map((z) => (
              <div
                key={z.id}
                className="zone"
                style={{ top: pct(z.y0, HEIGHT_M), height: pct(z.y1 - z.y0, HEIGHT_M) }}
              >
                <span style={{ top: pct(z.labelY - z.y0, z.y1 - z.y0) }}>{z.label}</span>
              </div>
            ))}

            {/* safe areas: space claimed by equipment that is in use */}
            {shown.items
              .filter((i) => !i.stored && !typeOf(i.type).marker)
              .map((i) => (
                <div key={`safe-${i.id}`} className="safe" style={rectStyle(safeRect(i))} />
              ))}
            {rackSafeRects(undefined, shown.active.rig).map((r, i) => (
              <div key={`rig-${i}`} className="safe" style={rectStyle(r)} />
            ))}
            {shown.active.wallBalls &&
              wallBallSafeRects().map((r, i) => <div key={`wb-${i}`} className="safe" style={rectStyle(r)} />)}

            {FIXED_EQUIPMENT.map((eq) => (
              <div
                key={eq.id}
                className="fixed-eq"
                title={`${eq.maker} ${eq.name} · ${eq.width} × ${eq.height} m`}
                style={rectStyle({ x: eq.x, y: eq.y, w: eq.width, h: eq.height })}
              >
                {eq.parts.map((part, i) => (
                  <span
                    key={i}
                    className={`station ${part.kind}${shown.active.rig.includes(i) ? ' on' : ''}`}
                    title={STATION_KINDS[part.kind].label}
                    style={{ flex: `0 0 ${(part.width / eq.width) * 100}%` }}
                  >
                    {part.width >= 0.5 ? STATION_KINDS[part.kind].short : null}
                  </span>
                ))}
              </div>
            ))}

            {byLayer(shown.items).map((it) => {
              const t = typeOf(it.type)
              const base = restingOn(it, shown.items)
              const stack = t.stackMax ? stackSize(it, shown.items) : 1
              const cls = `item${it.id === selectedId ? ' selected' : ''}${conflictIds.has(it.id) ? ' conflict' : ''}${warnIds.has(it.id) ? ' warn' : ''}${it.stored ? ' stored' : ''}${it.upright || footprint(it).w < 0.5 ? ' upright' : ''}${t.marker ? ' marker' : ''}`
              return (
                <div
                  key={it.id}
                  className={cls}
                  title={`${t.name} · ${t.length} × ${t.depth} m${it.upright ? ' · upright' : ''}${it.stored ? ' · stored' : ''}${base ? ` · standing on ${typeOf(base.type).name}` : ''}${conflictIds.has(it.id) ? ' · conflict' : ''}`}
                  style={{ ...rectStyle(footprint(it)), '--c': t.color } as React.CSSProperties}
                >
                  <span>
                    {t.short}
                    {stack > 1 && ` ${stack}x`}
                    {base && ' ↑'}
                  </span>
                </div>
              )
            })}

            {WALL_BALL_TARGETS.map((t) => (
              <div
                key={t.id}
                className="overhead"
                title={`${t.name} · overhead, space below stays usable`}
                style={rectStyle({ x: t.x, y: t.y, w: t.width, h: t.height })}
              />
            ))}

            {ghost && (
              <div
                className={`item ghost${ghostConflict ? ' conflict' : ''}`}
                style={{ ...rectStyle(footprint(ghost)), '--c': typeOf(ghost.type).color } as React.CSSProperties}
              >
                <span>{typeOf(ghost.type).short}</span>
              </div>
            )}
          </div>
          {tool === 'draw' && hover && (
            <div
              className="hover-box"
              style={{
                left: `${((hover.col * hoverStep) / COLS) * 100}%`,
                top: `${((hover.row * hoverStep) / ROWS) * 100}%`,
                width: `${(hoverStep / COLS) * 100}%`,
                height: `${(hoverStep / ROWS) * 100}%`,
              }}
            />
          )}
        </div>
        <div className="notes" style={{ '--rows': fields.length } as React.CSSProperties}>
          {fields.map((f) => (
            <label key={f.key} className="note">
              <span>{f.label}</span>
              <textarea
                value={notes[f.key] ?? ''}
                onChange={(e) => setNotes((n) => ({ ...n, [f.key]: e.target.value }))}
                placeholder={fields.length === 1 ? 'Workout…' : `Workout for ${f.label.toLowerCase()}…`}
                spellCheck={false}
              />
            </label>
          ))}
        </div>
      </div>

      <section className="legend" aria-label="Fixed equipment">
        {FIXED_EQUIPMENT.map((eq) => {
          const n = countStations(eq)
          return (
            <div key={eq.id} className="legend-row">
              <b>
                {eq.maker} {eq.name}
              </b>
              <span>
                {eq.width} × {eq.height} m · fixed
              </span>
              {(Object.keys(n) as (keyof typeof n)[]).map((k) => (
                <span key={k} className="legend-item">
                  <i className={`station-dot ${k}`} /> {n[k]} {STATION_KINDS[k].label.toLowerCase()}
                </span>
              ))}
            </div>
          )
        })}
        <div className="legend-row">
          <b>Wall ball targets</b>
          <span>overhead · space below stays usable</span>
          <span className="legend-item">
            <i className="overhead-dot" /> {WALL_BALL_TARGETS.map((t) => t.id.replace('wall-ball-', '')).join(', ')}
          </span>
        </div>
      </section>

      <footer className="status">
        <span>
          {WIDTH_M} × {HEIGHT_M} m
        </span>
        <span>
          Usable <b>{fmt(totalM2 - deadM2)}</b> m² · Dead <b>{fmt(deadM2)}</b> m² · Turf <b>{fmt(turfM2)}</b> m²
        </span>
        <span>
          Equipment{' '}
          <b>
            {equipmentCount}/{TOTAL_EQUIPMENT}
          </b>{' '}
          placed ({storedCount} stored)
          {spaceCount > 0 && ` · ${spaceCount} workout spaces`}
          {conflictIds.size > 0 && (
            <>
              {' · '}
              <b className="warn">{conflictIds.size} in conflict</b>
            </>
          )}
          {warnIds.size > 0 && (
            <>
              {' · '}
              <b className="tight">{warnIds.size} inside a safe area</b>
            </>
          )}
        </span>
        <span>
          {tool === 'equip' && hoverM
            ? `x ${fmt(Math.round(hoverM.x * 10) / 10)} m, y ${fmt(Math.round(hoverM.y * 10) / 10)} m`
            : tool === 'draw' && hover
              ? `${rowLabel(Math.floor((hover.row * hoverStep) / SUB))}${Math.floor((hover.col * hoverStep) / SUB) + 1} · x ${fmt((hover.col * hoverStep) / SUB)} m, y ${fmt((hover.row * hoverStep) / SUB)} m`
              : 'Hover the floor'}
        </span>
        <span className="hint">
          {tool === 'draw'
            ? 'Hold ⌥ to invert while drawing'
            : 'Pick a type, click to place · drag to move · R rotates · U upright · S stored · ⌫ removes · Esc deselects'}
        </span>
      </footer>
    </div>
  )
}
