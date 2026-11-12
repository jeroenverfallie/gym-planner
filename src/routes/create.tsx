import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { RotationFields } from '#/components/TemplateParts'
import { type Exercise, SPACE_LABEL, exerciseById } from '#/lib/exercises'
import { defaultFloor } from '#/lib/default-floor'
import { serialize } from '#/lib/floor'
import { type Picks, type Pick, buildNotes, customPick, generate, optionsFor, pickOf, rerollOne } from '#/lib/generate'
import { type Template, fmtTime, inRange, intoFactor, readTemplates, structureProblem, totalSeconds } from '#/lib/templates'
import { FOCUSES, type Focus, type Workout, newWorkoutId, noteFields, typeInfo, upsertWorkout, workoutLabel } from '#/lib/workouts'

export const Route = createFileRoute('/create')({
  component: Create,
  // `?template=<id>` opens that template.
  validateSearch: (search: Record<string, unknown>): { template?: string } => ({
    template: typeof search.template === 'string' ? search.template : undefined,
  }),
})

const randomSeed = () => Math.floor(Math.random() * 2 ** 31)
const CUSTOM = '__custom'

function Create() {
  const { template: wanted } = Route.useSearch()
  const [templates, setTemplates] = useState<Template[] | null>(null)
  const [tplId, setTplId] = useState<string | null>(null)
  // A working copy: timings can be changed here without touching the saved template.
  const [tpl, setTpl] = useState<Template | null>(null)
  const [focus, setFocus] = useState<Focus | null>(null)
  const [picks, setPicks] = useState<Picks>({})
  const [edited, setEdited] = useState<Record<string, string>>({}) // hand-edited workout text, by field
  const [name, setName] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)

  useEffect(() => {
    const l = readTemplates()
    setTemplates(l)
    setTplId((l.find((t) => t.id === wanted) ?? l[0])?.id ?? null)
  }, [wanted])

  // choosing a template: take a working copy and generate a first workout
  useEffect(() => {
    const t = templates?.find((x) => x.id === tplId)
    if (!t) {
      setTpl(null)
      return
    }
    const copy: Template = JSON.parse(JSON.stringify(t))
    setTpl(copy)
    setFocus(t.focus)
    setPicks(generate(copy, t.focus, randomSeed()))
    setEdited({})
    setName(t.name)
    setSavedId(null)
  }, [tplId, templates])

  const generated = useMemo(() => (tpl ? buildNotes(tpl, picks) : {}), [tpl, picks])
  const texts = { ...generated, ...edited }
  const total = tpl ? totalSeconds(tpl) : 0
  const stationCount = tpl?.sections.reduce((n, s) => n + s.stations.length, 0) ?? 0

  const shuffle = () => tpl && setPicks(generate(tpl, focus, randomSeed(), picks)) // locked picks stay
  const changeFocus = (f: Focus | null) => {
    setFocus(f)
    if (tpl) setPicks(generate(tpl, f, randomSeed(), picks))
  }
  const setPick = (stationId: string, i: number, pick: Pick) =>
    setPicks((p) => ({ ...p, [stationId]: p[stationId].map((x, k) => (k === i ? pick : x)) }))
  const reroll = (stationId: string, i: number) => tpl && setPicks(rerollOne(tpl, focus, randomSeed(), picks, stationId, i))
  const unlockAll = () => setPicks((p) => Object.fromEntries(Object.entries(p).map(([id, ps]) => [id, ps.map((x) => ({ ...x, locked: false }))])))
  const choose = (stationId: string, i: number, e: Exercise) => setPick(stationId, i, pickOf(e, true))

  const save = () => {
    if (!tpl || !name.trim()) return
    const w: Workout = {
      id: newWorkoutId(),
      name: name.trim(),
      type: tpl.type,
      focus: typeInfo(tpl.type).hasFocus ? (focus ?? tpl.focus ?? 'lower') : null,
      notes: Object.fromEntries(noteFields(tpl.type).map((f) => [f.key, texts[f.key] ?? ''])),
      plan: tpl.plan ?? serialize(defaultFloor()),
      savedAt: Date.now(),
    }
    upsertWorkout(w)
    setSavedId(w.id)
  }

  return (
    <main className="page wide">
      <h1>Generate a workout</h1>
      <p className="sub">Pick a template, shuffle until it feels right, lock what you like, and override anything by hand.</p>

      {templates?.length === 0 && (
        <p className="empty">
          No templates yet. Create one in <Link to="/templates">Templates</Link> first.
        </p>
      )}

      {tpl && templates && (
        <>
          <section className="panel gen-bar" aria-label="Generator">
            <div className="row">
              <select className="field" value={tplId ?? ''} onChange={(e) => setTplId(e.target.value)} aria-label="Template">
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <label className="dim">
                Focus
                <select className="field" value={focus ?? ''} onChange={(e) => changeFocus((e.target.value || null) as Focus | null)} aria-label="Focus">
                  <option value="">Any</option>
                  {FOCUSES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn primary" onClick={shuffle}>
                Shuffle
              </button>
              <button className="btn" onClick={unlockAll}>
                Unlock all
              </button>
              <span className="spacer" />
              <span className="badge">{workoutLabel({ type: tpl.type, focus: null })}</span>
              <span className={inRange(total) ? 'muted' : 'warn'}>
                {fmtTime(total)} · {stationCount} stations
              </span>
              <Link className="btn ghost" to="/templates">
                Edit template
              </Link>
            </div>
          </section>

          <div className="gen-layout">
            <div className="gen-sections">
              {tpl.sections.map((s, si) => (
                <section className="panel" key={s.key} aria-label={`Section ${s.label}`}>
                  <div className="row">
                    <b className="section-title">{s.label}</b>
                    {structureProblem(s) && <span className="warn">{structureProblem(s)}</span>}
                  </div>
                  <RotationFields
                    rotation={s.rotation}
                    stations={s.stations.length}
                    factor={intoFactor(s.stations)}
                    onChange={(rotation) => setTpl({ ...tpl, sections: tpl.sections.map((x, j) => (j === si ? { ...x, rotation } : x)) })}
                  />
                  {s.stations.map((st, sti) => (
                    <div className="gen-station" key={st.id}>
                      <div className="row">
                        <b>Station {sti + 1}</b>
                        <span className="badge small">{st.kind}</span>
                        <span className="muted">
                          {st.spots} people · {SPACE_LABEL[st.space]}
                        </span>
                      </div>
                      {(picks[st.id] ?? []).map((p, i) => {
                        const options = optionsFor(tpl, st, focus)
                        const inList = p.exerciseId !== null && options.some((o) => o.id === p.exerciseId)
                        const current = p.exerciseId ? exerciseById(p.exerciseId) : undefined
                        return (
                          <div className="move-row" key={i}>
                            <button
                              className={p.locked ? 'btn active' : 'btn'}
                              onClick={() => setPick(st.id, i, { ...p, locked: !p.locked })}
                              aria-pressed={p.locked}
                              title={p.locked ? 'Locked: Shuffle keeps it' : 'Lock it so Shuffle keeps it'}
                            >
                              {p.locked ? 'Locked' : 'Lock'}
                            </button>
                            {p.exerciseId === null && p.name !== '—' ? (
                              <input
                                className="field grow"
                                value={p.name}
                                onChange={(e) => setPick(st.id, i, { ...p, name: e.target.value.toUpperCase(), locked: true })}
                                aria-label="Exercise name"
                              />
                            ) : (
                              <select
                                className="field grow"
                                value={p.exerciseId ?? ''}
                                onChange={(e) => {
                                  if (e.target.value === CUSTOM) return setPick(st.id, i, customPick('MY EXERCISE'))
                                  const ex = exerciseById(e.target.value)
                                  if (ex) choose(st.id, i, ex)
                                }}
                                aria-label="Exercise"
                              >
                                {p.exerciseId === null && <option value="">—</option>}
                                {current && !inList && <option value={current.id}>{current.name} (outside the filter)</option>}
                                {options.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name}
                                  </option>
                                ))}
                                <option value={CUSTOM}>Type my own…</option>
                              </select>
                            )}
                            <input
                              className="field dose"
                              value={p.dose}
                              onChange={(e) => setPick(st.id, i, { ...p, dose: e.target.value.toUpperCase() })}
                              aria-label="Amount"
                              placeholder="amount"
                            />
                            <button className="btn" onClick={() => reroll(st.id, i)} title="Pick a different exercise for this slot">
                              Reroll
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </section>
              ))}
            </div>

            <aside className="panel gen-preview" aria-label="Workout text">
              <h2>Workout text</h2>
              {noteFields(tpl.type).map((f) => (
                <label key={f.key} className="note-edit">
                  <span>
                    {f.label}
                    {edited[f.key] !== undefined && (
                      <button className="btn ghost small" onClick={() => setEdited(({ [f.key]: _, ...rest }) => rest)}>
                        Reset to generated
                      </button>
                    )}
                  </span>
                  <textarea
                    value={texts[f.key] ?? ''}
                    onChange={(e) => setEdited((x) => ({ ...x, [f.key]: e.target.value }))}
                    spellCheck={false}
                    rows={Math.min(18, Math.max(6, (texts[f.key] ?? '').split('\n').length + 1))}
                  />
                </label>
              ))}
              <div className="row">
                <input className="field name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Workout name" aria-label="Workout name" />
                <button className="btn primary" onClick={save} disabled={!name.trim()}>
                  Save to catalogue
                </button>
              </div>
              {savedId && (
                <p className="flash">
                  Saved.{' '}
                  <Link to="/" search={{ workout: savedId }}>
                    Open in the planner
                  </Link>{' '}
                  or see the <Link to="/workouts">catalogue</Link>.
                </p>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  )
}
