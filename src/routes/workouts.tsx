import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { MiniPlan } from '#/components/MiniPlan'
import { type Workout, inUseSummary, noteFields, planOf, readWorkouts, removeWorkout, workoutLabel } from '#/lib/workouts'

export const Route = createFileRoute('/workouts')({ component: Catalogue })

function Catalogue() {
  // Workouts live in this browser, so read them after mount (the server render has none).
  const [list, setList] = useState<Workout[] | null>(null)
  useEffect(() => setList(readWorkouts()), [])

  const remove = (w: Workout) => {
    if (!window.confirm(`Delete "${w.name}" from the catalogue?`)) return
    removeWorkout(w.id)
    setList(readWorkouts())
  }

  return (
    <main className="page">
      <h1>Workout catalogue</h1>
      <p className="sub">Saved workouts with the floor plan they use. Open one to edit it in the planner.</p>

      {list && list.length === 0 && (
        <p className="empty">
          No workouts yet. Plan one in the <Link to="/">planner</Link> and press <b>Save workout</b>.
        </p>
      )}

      <div className="catalogue">
        {list?.map((w) => {
          const plan = planOf(w)
          const uses = plan ? inUseSummary(plan) : []
          return (
            <article key={w.id} className="card">
              <div className="card-plan">{plan && <MiniPlan floor={plan} title={`Floor plan of ${w.name}`} />}</div>
              <div className="card-body">
                <div className="card-head">
                  <h2>{w.name}</h2>
                  <span className="badge">{workoutLabel(w)}</span>
                </div>
                <p className="card-date">Saved {new Date(w.savedAt).toLocaleDateString()}</p>
                {uses.length > 0 && <p className="card-uses">{uses.join(' · ')}</p>}
                <div className="card-notes" style={{ '--cols': noteFields(w.type).length } as React.CSSProperties}>
                  {noteFields(w.type).map((f) => (
                    <div key={f.key}>
                      <h3>{f.label}</h3>
                      <pre>{w.notes[f.key]?.trim() || '—'}</pre>
                    </div>
                  ))}
                </div>
                <div className="card-actions">
                  <Link to="/" search={{ workout: w.id }} className="btn primary">
                    Open
                  </Link>
                  <button className="btn" onClick={() => remove(w)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
