import type { Need, Space } from "#/lib/exercises";
import { type Focus, type WorkoutType, noteFields } from "#/lib/workouts";

/**
 * A template is a reusable workout *structure*: the sections (the text fields of the workout type), how people
 * rotate and the timings, and the stations (slots) in each section: what kind of work, which equipment and floor
 * it has, how many people. It can carry a floor plan snapshot. The generator fills the slots with exercises.
 */

/** How a section runs. */
export type Style = "into" | "alternate" | "rotate" | "circuit";

export const STYLES: { id: Style; label: string; blurb: string }[] = [
  {
    id: "into",
    label: "INTO",
    blurb: "Two stations, half the people on each, then they swap.",
  },
  {
    id: "alternate",
    label: "Partners alternate",
    blurb: "One station, partners take turns (work / rest each).",
  },
  {
    id: "rotate",
    label: "Rotate",
    blurb: "Teams rotate through the stations, each station its own intervals.",
  },
  {
    id: "circuit",
    label: "Circuit",
    blurb:
      "People move through every station, repeated for a number of rounds.",
  },
];

/** Times are in seconds. */
export type Rotation = {
  style: Style;
  rounds: number;
  work: number;
  rest: number;
  move: number;
};

export type StationKind = "strength" | "cardio" | "any";

export type StationDef = {
  id: string;
  kind: StationKind;
  /** Equipment this slot has: the generator only picks exercises whose needs fit in here. */
  needs: Need[];
  /** Floor this slot has. */
  space: Space;
  /** People at the station (used for kettlebell / dumbbell / barbell limits). */
  spots: number;
  /** How many movements are done together in each interval. */
  movements: number;
};

export type SectionDef = {
  key: string;
  label: string;
  rotation: Rotation;
  stations: StationDef[];
};

export type Template = {
  id: string;
  name: string;
  type: WorkoutType;
  /** Default focus for lift types. */
  focus: Focus | null;
  formatId: string | null;
  sections: SectionDef[];
  /** Floor plan snapshot (the planner's serialized format), if the template has a layout. */
  plan: string | null;
  createdAt: number;
};

/* ------------------------------ timing ------------------------------ */

export const fmtTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/** "7:30" or "90" (seconds) to seconds; null if it isn't a time. */
export function parseTime(text: string): number | null {
  const m =
    text.trim().match(/^(\d+):([0-5]?\d)$/) ?? text.trim().match(/^(\d+)$/);
  if (!m) return null;
  return m[2] === undefined ? Number(m[1]) : Number(m[1]) * 60 + Number(m[2]);
}

/**
 * INTO: when either station has 2 movements, each movement gets the work time, so the station with 1
 * movement does it for double the work time. Both stations then run the same interval.
 */
export const intoFactor = (stations: StationDef[]) =>
  stations.some((st) => st.movements >= 2) ? 2 : 1;

export const interval = (r: Rotation, factor = 1) =>
  r.style === "into" ? r.work * factor + r.rest : r.work + r.rest;

/** How long a section takes, rest and moves included. */
export function sectionSeconds(
  r: Rotation,
  stations: number,
  factor = 1,
): number {
  const iv = interval(r, factor);
  switch (r.style) {
    case "into":
      return 2 * r.rounds * iv + r.move;
    case "alternate":
      return r.rounds * iv + r.move;
    case "rotate":
      return stations * (r.rounds * iv + r.move);
    case "circuit":
      return r.rounds * stations * iv + r.move;
  }
}

/** The whole workout: every section is done one after the other by each group. */
export const totalSeconds = (t: Template) =>
  t.sections.reduce(
    (n, s) =>
      n + sectionSeconds(s.rotation, s.stations.length, intoFactor(s.stations)),
    0,
  );

/** About 50 minutes, rest and moves included, is the target for a whole workout. */
export const inRange = (seconds: number) =>
  seconds >= 45 * 60 && seconds <= 55 * 60;

/** INTO needs exactly two stations; alternate exactly one. */
export function structureProblem(s: SectionDef): string | null {
  if (s.rotation.style === "into" && s.stations.length !== 2)
    return "INTO needs exactly 2 stations.";
  if (s.rotation.style === "alternate" && s.stations.length !== 1)
    return "Partners alternate needs exactly 1 station.";
  if (s.stations.length === 0) return "Add at least one station.";
  return null;
}

/* ------------------------------ formats ------------------------------ */

let counter = 0;
/** Station ids only need to be unique inside the app session and the template. */
export const newStationId = () =>
  `st-${Date.now().toString(36)}-${(counter++).toString(36)}`;

const station = (
  kind: StationKind,
  needs: Need[],
  space: Space,
  spots: number,
  movements = 1,
): StationDef => ({
  id: newStationId(),
  kind,
  needs,
  space,
  spots,
  movements,
});

const rot = (
  style: Style,
  rounds: number,
  work: number,
  rest: number,
  move: number,
): Rotation => ({ style, rounds, work, rest, move });

// equipment each zone realistically has
const RIG = ["barbell", "pullup", "db", "kb"] as Need[];
const TURF = ["bench", "plyo", "db", "kb", "mat"] as Need[];
const MATZ = ["mat", "db", "kb", "plyo"] as Need[];

export type Format = {
  id: string;
  name: string;
  blurb: string;
  types: WorkoutType[];
  build: (type: WorkoutType) => SectionDef[];
};

const zones = (type: WorkoutType) => noteFields(type); // rig / turf / mat for the lifts
const zoneNeeds: Record<string, Need[]> = { rig: RIG, turf: TURF, mat: MATZ };
const zoneCardio: Record<string, Need[]> = {
  rig: ["skierg", "echo"],
  turf: ["rowerg", "bikeerg"],
  mat: ["echo", "bikeerg", "runner"],
};

export const FORMATS: Format[] = [
  {
    id: "zones-into",
    name: "Zones · INTO duos",
    blurb:
      "3 zones of 8: half on one strength station, half on the other, then swap. 5 × (0:50 work, 0:40 rest).",
    types: ["lift"],
    build: (type) =>
      zones(type).map((f) => ({
        key: f.key,
        label: f.label,
        rotation: rot("into", 5, 50, 40, 90),
        stations: [
          station("strength", zoneNeeds[f.key], "M", 4),
          station("strength", zoneNeeds[f.key], "M", 4),
        ],
      })),
  },
  {
    id: "zones-alternate",
    name: "Zones · partners alternate",
    blurb:
      "3 zones, one station each: partners take turns. 5 × 3:00 (1:30 work, 1:30 rest each).",
    types: ["lift"],
    build: (type) =>
      zones(type).map((f) => ({
        key: f.key,
        label: f.label,
        rotation: rot("alternate", 5, 90, 90, 90),
        stations: [station("strength", zoneNeeds[f.key], "M", 8, 2)],
      })),
  },
  {
    id: "zones-mixed",
    name: "Zones · rig alternate, turf and mat INTO",
    blurb:
      "The rig has one partner station, the turf and the mat split into two with INTO.",
    types: ["lift"],
    build: (type) =>
      zones(type).map((f) =>
        f.key === "rig"
          ? {
              key: f.key,
              label: f.label,
              rotation: rot("alternate", 5, 90, 90, 90),
              stations: [station("strength", RIG, "S", 8, 2)],
            }
          : {
              key: f.key,
              label: f.label,
              rotation: rot("into", 5, 50, 40, 90),
              stations: [
                station("strength", zoneNeeds[f.key], "M", 4),
                station("strength", zoneNeeds[f.key], "L", 4),
              ],
            },
      ),
  },
  {
    id: "zones-circuit",
    name: "Zones · strength circuit",
    blurb:
      "3 zones, each a circuit of 4 strength stations, 2 rounds of 2:00 per station.",
    types: ["lift"],
    build: (type) =>
      zones(type).map((f) => ({
        key: f.key,
        label: f.label,
        rotation: rot("circuit", 2, 100, 20, 30),
        stations: [0, 1, 2, 3].map(() =>
          station("strength", zoneNeeds[f.key], "M", 2),
        ),
      })),
  },
  {
    id: "rush-into",
    name: "Rush · strength INTO cardio",
    blurb:
      "3 zones: half on strength, half on cardio, then swap, so cardio is half of everyone's time. 5 × 1:30.",
    types: ["lift-rush"],
    build: (type) =>
      zones(type).map((f) => ({
        key: f.key,
        label: f.label,
        rotation: rot("into", 5, 60, 30, 90),
        stations: [
          station("strength", zoneNeeds[f.key], "M", 4),
          station("cardio", zoneCardio[f.key], "none", 4),
        ],
      })),
  },
  {
    id: "rush-circuit",
    name: "Rush · circuit, strength and cardio alternating",
    blurb:
      "3 zones, each a circuit that alternates strength and cardio stations. 2 rounds of 2:00 per station.",
    types: ["lift-rush"],
    build: (type) =>
      zones(type).map((f) => ({
        key: f.key,
        label: f.label,
        rotation: rot("circuit", 2, 100, 20, 30),
        stations: [
          station("strength", zoneNeeds[f.key], "M", 2),
          station("cardio", zoneCardio[f.key], "none", 2),
          station("strength", zoneNeeds[f.key], "M", 2),
          station("cardio", zoneCardio[f.key], "none", 2),
        ],
      })),
  },
  {
    id: "hyrox-rotate",
    name: "Hyrox · 6 stations rotate",
    blurb:
      "6 teams of 4 rotate through 6 stations: 3 × (2:00 work, 0:20 rest), 1:00 move.",
    types: ["hyrox"],
    build: () => [
      {
        key: "all",
        label: "Workout",
        rotation: rot("rotate", 3, 120, 20, 60),
        stations: [
          station("cardio", ["skierg", "rowerg", "bikeerg", "echo"], "none", 4),
          station("any", ["kb", "db"], "lane", 4),
          station("cardio", ["wallball"], "none", 4),
          station("cardio", [], "lane", 4),
          station("cardio", ["rowerg", "skierg", "bikeerg"], "none", 4),
          station("cardio", ["sled"], "none", 4),
        ],
      },
    ],
  },
  {
    id: "hyrox-run",
    name: "Hyrox · 8 stations with a run",
    blurb:
      "8 stations including a run outside: 3 × (1:20 work, 0:40 rest), 0:30 move.",
    types: ["hyrox-outside"],
    build: () => [
      {
        key: "all",
        label: "Workout",
        rotation: rot("rotate", 3, 80, 40, 30),
        stations: [
          station("cardio", [], "none", 3),
          station("cardio", ["skierg", "rowerg", "bikeerg"], "none", 3),
          station("cardio", ["sled"], "none", 3),
          station("cardio", [], "lane", 3),
          station("cardio", ["rowerg", "skierg", "bikeerg"], "none", 3),
          station("any", ["kb", "db"], "lane", 3),
          station("any", ["db", "kb", "plyo"], "lane", 3),
          station("cardio", ["wallball"], "none", 3),
        ],
      },
    ],
  },
  {
    id: "fifty-into",
    name: "50-50 · halves INTO",
    blurb:
      "Strength half and cardio half, each split with INTO (6 + 6), swapping after 25:00. 6 × 2:00.",
    types: ["fifty-fifty"],
    build: () => [
      {
        key: "strength",
        label: "Strength",
        rotation: rot("into", 6, 70, 50, 60),
        stations: [
          station(
            "strength",
            ["barbell", "bench", "db", "kb", "plyo", "mat"],
            "M",
            6,
          ),
          station("strength", ["bench", "db", "kb", "plyo", "mat"], "M", 6),
        ],
      },
      {
        key: "cardio",
        label: "Cardio",
        rotation: rot("into", 6, 80, 40, 60),
        stations: [
          station("cardio", ["bikeerg", "echo"], "none", 6),
          station("cardio", ["rowerg", "skierg", "runner"], "none", 6),
        ],
      },
    ],
  },
  {
    id: "fifty-circuit",
    name: "50-50 · strength circuit, cardio INTO",
    blurb:
      "The strength half is a circuit of 4 stations (2 rounds of 3:00 each), the cardio half is split with INTO.",
    types: ["fifty-fifty"],
    build: () => [
      {
        key: "strength",
        label: "Strength",
        rotation: rot("circuit", 2, 160, 20, 60),
        stations: [0, 1, 2, 3].map(() =>
          station("strength", ["db", "kb", "plyo", "mat", "bench"], "M", 3),
        ),
      },
      {
        key: "cardio",
        label: "Cardio",
        rotation: rot("into", 6, 80, 40, 60),
        stations: [
          station("cardio", ["rowerg", "skierg"], "none", 6),
          station("cardio", ["echo", "bikeerg", "runner"], "none", 6),
        ],
      },
    ],
  },
];

export const formatById = (id: string | null) =>
  FORMATS.find((f) => f.id === id);
export const formatsFor = (type: WorkoutType) =>
  FORMATS.filter((f) => f.types.includes(type));

export const newTemplateId = () =>
  `t-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function templateFromFormat(
  f: Format,
  type: WorkoutType,
  name: string,
  focus: Focus | null,
): Template {
  return {
    id: newTemplateId(),
    name,
    type,
    focus,
    formatId: f.id,
    sections: f.build(type),
    plan: null,
    createdAt: Date.now(),
  };
}

/** An empty-ish station to add in the editor. */
export const blankStation = (): StationDef =>
  station("strength", ["db", "kb", "mat"], "M", 4);

/* ------------------------------ storage (this browser) ------------------------------ */

const KEY = "gym-planner:templates:v1";

const isTemplate = (t: unknown): t is Template => {
  const x = t as Template;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.name === "string" &&
    Array.isArray(x.sections) &&
    typeof x.type === "string"
  );
};

export function readTemplates(): Template[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return (Array.isArray(raw) ? raw.filter(isTemplate) : []).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  } catch {
    return [];
  }
}

function writeTemplates(list: Template[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked */
  }
}

export function upsertTemplate(t: Template) {
  const rest = readTemplates().filter((x) => x.id !== t.id);
  writeTemplates([t, ...rest].sort((a, b) => b.createdAt - a.createdAt));
}

export function removeTemplate(id: string) {
  writeTemplates(readTemplates().filter((x) => x.id !== id));
}
