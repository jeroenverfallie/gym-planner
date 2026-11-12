import {
  BLK_BOX_RACK,
  type StationKind,
  isTypeId,
  rackPartsOfKind,
  typeOf,
} from "#/lib/equipment";
import { type Floor, deserialize } from "#/lib/floor";

/** The five kinds of workout the gym runs. */
export type WorkoutType =
  | "lift"
  | "lift-rush"
  | "hyrox"
  | "hyrox-outside"
  | "fifty-fifty";
export type Focus = "lower" | "upper";
/** The typed workout text, by field key (see `noteFields`). Keeps every field ever typed, so switching type loses nothing. */
export type Notes = Record<string, string>;

export const WORKOUT_TYPES: {
  id: WorkoutType;
  label: string;
  hasFocus: boolean;
}[] = [
  { id: "lift", label: "Lift", hasFocus: true },
  { id: "lift-rush", label: "Lift & Rush", hasFocus: true },
  { id: "hyrox", label: "Hyrox", hasFocus: false },
  { id: "hyrox-outside", label: "Hyrox + outside run", hasFocus: false },
  { id: "fifty-fifty", label: "50-50", hasFocus: false },
];

export const FOCUSES: { id: Focus; label: string }[] = [
  { id: "lower", label: "Lower" },
  { id: "upper", label: "Upper" },
];

export type NoteField = { key: string; label: string };

/** The text fields a workout type has: Hyrox one big one, 50-50 strength/cardio, the lifts one per zone. */
export function noteFields(type: WorkoutType): NoteField[] {
  if (type === "hyrox" || type === "hyrox-outside")
    return [{ key: "all", label: "Workout" }];
  if (type === "fifty-fifty")
    return [
      { key: "strength", label: "Strength" },
      { key: "cardio", label: "Cardio" },
    ];
  return [
    { key: "rig", label: "Rig" },
    { key: "turf", label: "Turf" },
    { key: "mat", label: "Mat" },
  ];
}

export const typeInfo = (id: WorkoutType) =>
  WORKOUT_TYPES.find((t) => t.id === id) ?? WORKOUT_TYPES[0];

/** "Lift · Lower", "Hyrox"… */
export function workoutLabel(w: { type: WorkoutType; focus: Focus | null }) {
  const t = typeInfo(w.type);
  const f = w.focus ? FOCUSES.find((x) => x.id === w.focus)?.label : null;
  return f && t.hasFocus ? `${t.label} · ${f}` : t.label;
}

/** A saved workout: its description plus a snapshot of the floor plan (equipment, what's in use, the zone texts). */
export type Workout = {
  id: string;
  name: string;
  type: WorkoutType;
  focus: Focus | null;
  notes: Notes;
  /** The floor plan, in the same compact format the planner saves (see `serialize` in floor.ts). */
  plan: string;
  savedAt: number;
};

const KEY = "gym-planner:workouts:v1";

export const newWorkoutId = () =>
  `w-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const isWorkout = (w: unknown): w is Workout => {
  const x = w as Workout;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.name === "string" &&
    WORKOUT_TYPES.some((t) => t.id === x.type) &&
    typeof x.plan === "string" &&
    typeof x.savedAt === "number" &&
    !!x.notes &&
    typeof x.notes === "object"
  );
};

/** All saved workouts, newest first. Browser only (empty on the server or if storage is unreadable). */
export function readWorkouts(): Workout[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return (Array.isArray(raw) ? raw.filter(isWorkout) : []).sort(
      (a, b) => b.savedAt - a.savedAt,
    );
  } catch {
    return [];
  }
}

function writeWorkouts(list: Workout[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked: nothing more we can do here */
  }
}

/** Add a workout, or replace the one with the same id. */
export function upsertWorkout(w: Workout) {
  writeWorkouts([w, ...readWorkouts().filter((x) => x.id !== w.id)]);
}

export function removeWorkout(id: string) {
  writeWorkouts(readWorkouts().filter((x) => x.id !== id));
}

export const planOf = (w: Workout): Floor | null => deserialize(w.plan);

const RIG_LABELS: Record<StationKind, string> = {
  barbell: "barbell bay",
  pull: "pull station",
  pullup: "pull-up bay",
};

/** What a workout uses: equipment in use (not stored), the rig stations switched on, wall balls, workout spaces. */
export function inUseSummary(floor: Floor): string[] {
  const out: string[] = [];

  for (const kind of ["barbell", "pull", "pullup"] as StationKind[]) {
    const n = rackPartsOfKind(kind, BLK_BOX_RACK).filter((i) =>
      floor.active.rig.includes(i),
    ).length;
    if (n) out.push(`${n} ${RIG_LABELS[kind]}${n > 1 ? "s" : ""}`);
  }
  const balls = floor.active.wallBalls.length;
  if (balls)
    out.push(
      balls === 4 ? "wall balls" : `${balls} wall ball${balls > 1 ? "s" : ""}`,
    );

  const counts = new Map<string, number>();
  let spaces = 0;
  for (const it of floor.items) {
    if (!isTypeId(it.type) || it.stored) continue;
    const t = typeOf(it.type);
    if (t.marker) spaces++;
    else counts.set(t.name, (counts.get(t.name) ?? 0) + 1);
  }
  for (const [name, n] of counts) out.push(`${n} × ${name}`);
  if (spaces) out.push(`${spaces} workout space${spaces > 1 ? "s" : ""}`);
  return out;
}
