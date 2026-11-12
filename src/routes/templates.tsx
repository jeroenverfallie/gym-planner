import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MiniPlan } from "#/components/MiniPlan";
import { NumField, RotationFields } from "#/components/TemplateParts";
import {
  NEEDS,
  type Need,
  SPACES,
  SPACE_LABEL,
  type Space,
} from "#/lib/exercises";
import { deserialize } from "#/lib/floor";
import {
  type StationDef,
  type StationKind,
  type Template,
  blankStation,
  fmtTime,
  formatById,
  intoFactor,
  formatsFor,
  inRange,
  newStationId,
  newTemplateId,
  readTemplates,
  removeTemplate,
  structureProblem,
  templateFromFormat,
  totalSeconds,
  upsertTemplate,
} from "#/lib/templates";
import {
  FOCUSES,
  type Focus,
  WORKOUT_TYPES,
  type WorkoutType,
  typeInfo,
  workoutLabel,
} from "#/lib/workouts";

export const Route = createFileRoute("/templates")({ component: Templates });

function Templates() {
  const [list, setList] = useState<Template[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newType, setNewType] = useState<WorkoutType>("lift");
  const [newFormat, setNewFormat] = useState(formatsFor("lift")[0].id);
  const [newName, setNewName] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Templates live in this browser: read them after mount.
  useEffect(() => {
    const l = readTemplates();
    setList(l);
    setSelectedId(l[0]?.id ?? null);
  }, []);

  const refresh = () => setList(readTemplates());
  const selected = list?.find((t) => t.id === selectedId) ?? null;
  const formats = formatsFor(newType);
  const format = formatById(newFormat);

  const changeType = (type: WorkoutType) => {
    setNewType(type);
    setNewFormat(formatsFor(type)[0].id);
  };
  const create = () => {
    const f = formatById(newFormat);
    if (!f) return;
    const t = templateFromFormat(
      f,
      newType,
      newName.trim() || f.name,
      typeInfo(newType).hasFocus ? "lower" : null,
    );
    upsertTemplate(t);
    refresh();
    setSelectedId(t.id);
    setNewName("");
  };
  const change = (t: Template) => {
    upsertTemplate(t);
    refresh();
  };
  const duplicate = (t: Template) => {
    const copy: Template = {
      ...t,
      id: newTemplateId(),
      name: `${t.name} copy`,
      createdAt: Date.now(),
      sections: t.sections.map((s) => ({
        ...s,
        stations: s.stations.map((st) => ({ ...st, id: newStationId() })),
      })),
    };
    upsertTemplate(copy);
    refresh();
    setSelectedId(copy.id);
  };
  const remove = (t: Template) => {
    removeTemplate(t.id);
    setConfirmId(null);
    const l = readTemplates();
    setList(l);
    setSelectedId(l[0]?.id ?? null);
  };

  return (
    <main className="page wide">
      <h1>Templates</h1>
      <p className="sub">
        A template is the structure of a workout: its sections, how people
        rotate, the timings and the stations to fill. Then{" "}
        <Link to="/create">generate</Link> workouts from it.
      </p>

      <div className="tpl-layout">
        <aside className="tpl-side">
          <section className="panel" aria-label="New template">
            <b>New template</b>
            <div className="row">
              <select
                className="field"
                value={newType}
                onChange={(e) => changeType(e.target.value as WorkoutType)}
                aria-label="Workout type"
              >
                {WORKOUT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <select
                className="field"
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value)}
                aria-label="Format"
              >
                {formats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            {format && <p className="muted">{format.blurb}</p>}
            <div className="row">
              <input
                className="field name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={format?.name ?? "Template name"}
                aria-label="Template name"
              />
              <button className="btn primary" onClick={create}>
                Create
              </button>
            </div>
          </section>

          <div className="tpl-list">
            {list?.length === 0 && (
              <p className="muted">
                No templates yet. Create one from a format above.
              </p>
            )}
            {list?.map((t) => (
              <button
                key={t.id}
                className={t.id === selectedId ? "tpl-card active" : "tpl-card"}
                onClick={() => setSelectedId(t.id)}
              >
                <b>{t.name}</b>
                <span className="badge small">
                  {workoutLabel({ type: t.type, focus: null })}
                </span>
                <span className={inRange(totalSeconds(t)) ? "muted" : "warn"}>
                  {fmtTime(totalSeconds(t))}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="tpl-editor" aria-label="Template editor">
          {selected ? (
            <TemplateEditor
              key={selected.id}
              t={selected}
              onChange={change}
              onDuplicate={() => duplicate(selected)}
              confirming={confirmId === selected.id}
              onAskDelete={() => setConfirmId(selected.id)}
              onCancelDelete={() => setConfirmId(null)}
              onDelete={() => remove(selected)}
            />
          ) : (
            <p className="muted">Select a template, or create one.</p>
          )}
        </section>
      </div>
    </main>
  );
}

const KINDS: { id: StationKind; label: string }[] = [
  { id: "strength", label: "Strength" },
  { id: "cardio", label: "Cardio" },
  { id: "any", label: "Any" },
];

function TemplateEditor({
  t,
  onChange,
  onDuplicate,
  confirming,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  t: Template;
  onChange: (t: Template) => void;
  onDuplicate: () => void;
  confirming: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const plan = useMemo(() => (t.plan ? deserialize(t.plan) : null), [t.plan]);
  const total = totalSeconds(t);
  const setSection = (
    i: number,
    patch: Partial<Template["sections"][number]>,
  ) =>
    onChange({
      ...t,
      sections: t.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });
  const setStation = (si: number, sti: number, patch: Partial<StationDef>) =>
    setSection(si, {
      stations: t.sections[si].stations.map((st, k) =>
        k === sti ? { ...st, ...patch } : st,
      ),
    });
  const toggleNeed = (si: number, sti: number, need: Need) => {
    const st = t.sections[si].stations[sti];
    setStation(si, sti, {
      needs: st.needs.includes(need)
        ? st.needs.filter((n) => n !== need)
        : [...st.needs, need],
    });
  };

  const usePlannerLayout = () => {
    const raw = localStorage.getItem("gym-planner:floor:v2");
    if (raw && deserialize(raw)) onChange({ ...t, plan: raw });
  };

  return (
    <div className="editor-col">
      <section className="panel">
        <div className="row">
          <input
            className="field name"
            value={t.name}
            onChange={(e) => onChange({ ...t, name: e.target.value })}
            aria-label="Template name"
          />
          <span className="badge">
            {workoutLabel({ type: t.type, focus: null })}
          </span>
          {typeInfo(t.type).hasFocus && (
            <label className="dim">
              Default focus
              <select
                className="field"
                value={t.focus ?? "lower"}
                onChange={(e) =>
                  onChange({ ...t, focus: e.target.value as Focus })
                }
                aria-label="Default focus"
              >
                {FOCUSES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="spacer" />
          <Link
            className="btn primary"
            to="/create"
            search={{ template: t.id }}
          >
            Generate
          </Link>
          <button className="btn" onClick={onDuplicate}>
            Duplicate
          </button>
          {confirming ? (
            <span
              className="confirm"
              role="alertdialog"
              aria-label="Confirm deleting the template"
            >
              <b>Delete this template?</b>
              <button className="btn danger" onClick={onDelete} autoFocus>
                Yes, delete
              </button>
              <button className="btn" onClick={onCancelDelete}>
                Cancel
              </button>
            </span>
          ) : (
            <button className="btn" onClick={onAskDelete}>
              Delete
            </button>
          )}
        </div>
        <p className={inRange(total) ? "muted" : "warn"}>
          Total {fmtTime(total)}, rest and moves included
          {inRange(total) ? "" : " (aim for about 50:00)"}. No warm-up or
          cool-down.
        </p>
      </section>

      <section className="panel layout-panel">
        <div className="row">
          <b>Layout</b>
          <span className="muted">
            The floor plan generated workouts are saved with.
          </span>
          <span className="spacer" />
          <button className="btn" onClick={usePlannerLayout}>
            Use the planner's layout
          </button>
          {t.plan && (
            <button
              className="btn ghost"
              onClick={() => onChange({ ...t, plan: null })}
            >
              Clear
            </button>
          )}
        </div>
        {plan ? (
          <MiniPlan floor={plan} title="Template layout" />
        ) : (
          <p className="muted">
            No layout: workouts will use the default floor plan.
          </p>
        )}
      </section>

      {t.sections.map((s, si) => {
        const problem = structureProblem(s);
        return (
          <section
            className="panel"
            key={s.key}
            aria-label={`Section ${s.label}`}
          >
            <div className="row">
              <b className="section-title">{s.label}</b>
              {problem && <span className="warn">{problem}</span>}
            </div>
            <RotationFields
              rotation={s.rotation}
              stations={s.stations.length}
              factor={intoFactor(s.stations)}
              onChange={(rotation) =>
                setSection(si, {
                  rotation,
                  // INTO stations hold at most 2 movements
                  stations:
                    rotation.style === "into"
                      ? s.stations.map((st) => ({
                          ...st,
                          movements: Math.min(st.movements, 2),
                        }))
                      : s.stations,
                })
              }
            />

            <div className="stations">
              {s.stations.map((st, sti) => (
                <div className="station-def" key={st.id}>
                  <div className="row">
                    <b>Station {sti + 1}</b>
                    <label className="dim">
                      Kind
                      <select
                        className="field"
                        value={st.kind}
                        onChange={(e) =>
                          setStation(si, sti, {
                            kind: e.target.value as StationKind,
                          })
                        }
                        aria-label="Kind"
                      >
                        {KINDS.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dim">
                      Floor
                      <select
                        className="field"
                        value={st.space}
                        onChange={(e) =>
                          setStation(si, sti, {
                            space: e.target.value as Space,
                          })
                        }
                        aria-label="Floor space"
                      >
                        {SPACES.map((sp) => (
                          <option key={sp} value={sp}>
                            {SPACE_LABEL[sp]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <NumField
                      label="People"
                      value={st.spots}
                      onChange={(spots) => setStation(si, sti, { spots })}
                      max={24}
                    />
                    <NumField
                      label="Movements"
                      value={st.movements}
                      onChange={(movements) =>
                        setStation(si, sti, { movements })
                      }
                      max={s.rotation.style === "into" ? 2 : 3}
                    />
                    <span className="spacer" />
                    <button
                      className="btn ghost"
                      onClick={() =>
                        setSection(si, {
                          stations: s.stations.filter((_, k) => k !== sti),
                        })
                      }
                      disabled={s.stations.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                  <div
                    className="chips"
                    aria-label="Equipment this station has"
                  >
                    {NEEDS.map((n) => (
                      <button
                        key={n.id}
                        className={
                          st.needs.includes(n.id) ? "chip active" : "chip"
                        }
                        onClick={() => toggleNeed(si, sti, n.id)}
                        aria-pressed={st.needs.includes(n.id)}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                className="btn"
                onClick={() =>
                  setSection(si, { stations: [...s.stations, blankStation()] })
                }
              >
                Add station
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
