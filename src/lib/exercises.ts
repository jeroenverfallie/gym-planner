/**
 * The exercise library the workout generator draws from. Each exercise says what it needs (equipment), how much
 * floor it takes, what it trains and whether it is strength or cardio. Names are in the gym's house style
 * (upper case, no loads: "moving matters more than the weight").
 */

/** Equipment an exercise may need. Free weights are pools (dumbbells, kettlebells, plates), the rest are stations. */
export type Need =
  | 'bench'
  | 'plyo'
  | 'db'
  | 'kb'
  | 'barbell'
  | 'plate'
  | 'mat'
  | 'pullup'
  | 'rowerg'
  | 'skierg'
  | 'bikeerg'
  | 'echo'
  | 'runner'
  | 'sled'
  | 'wallball'

export const NEEDS: { id: Need; label: string; group: 'strength' | 'cardio' }[] = [
  { id: 'db', label: 'Dumbbells', group: 'strength' },
  { id: 'kb', label: 'Kettlebells', group: 'strength' },
  { id: 'barbell', label: 'Barbell', group: 'strength' },
  { id: 'plate', label: 'Plates', group: 'strength' },
  { id: 'bench', label: 'Bench', group: 'strength' },
  { id: 'plyo', label: 'Plyo box', group: 'strength' },
  { id: 'mat', label: 'Mat', group: 'strength' },
  { id: 'pullup', label: 'Pull-up bay', group: 'strength' },
  { id: 'rowerg', label: 'RowErg', group: 'cardio' },
  { id: 'skierg', label: 'SkiErg', group: 'cardio' },
  { id: 'bikeerg', label: 'BikeErg', group: 'cardio' },
  { id: 'echo', label: 'Echo Bike', group: 'cardio' },
  { id: 'runner', label: 'Runner', group: 'cardio' },
  { id: 'sled', label: 'Sled', group: 'cardio' },
  { id: 'wallball', label: 'Wall ball', group: 'cardio' },
]

export const needLabel = (n: Need) => NEEDS.find((x) => x.id === n)?.label ?? n

export type Area = 'lower' | 'upper' | 'core' | 'full'
/** Floor an exercise needs: none (a machine or station), a stationary spot, floor work, travelling room, a long lane. */
export type Space = 'none' | 'S' | 'M' | 'L' | 'lane'
export const SPACES: Space[] = ['none', 'S', 'M', 'L', 'lane']
export const SPACE_LABEL: Record<Space, string> = { none: 'No space', S: 'Space S', M: 'Space M', L: 'Space L', lane: 'Lane' }

/** A station with `have` floor can host an exercise that needs `need` (a bigger space fits a smaller need). */
export const spaceFits = (need: Space, have: Space) => SPACES.indexOf(need) <= SPACES.indexOf(have)

export type Exercise = {
  id: string
  name: string
  kind: 'strength' | 'cardio'
  area: Area
  needs: Need[]
  space: Space
  /** Done on each side ("L|R"). */
  sides?: boolean
  /** Default prescription shown next to the name: reps, distance, calories or time. */
  dose: string
  /** Only for workouts that run outside (Hyrox with running outside). */
  outside?: boolean
}

const ex = (
  id: string,
  name: string,
  kind: Exercise['kind'],
  area: Area,
  needs: Need[],
  space: Space,
  dose: string,
  sides = false,
): Exercise => ({ id, name, kind, area, needs, space, dose, sides })

export const EXERCISES: Exercise[] = [
  // ---- lower body, strength ----
  ex('bb-back-squat', 'BARBELL BACK SQUAT', 'strength', 'lower', ['barbell'], 'S', '8-10'),
  ex('bb-front-squat', 'BARBELL FRONT SQUAT', 'strength', 'lower', ['barbell'], 'S', '8-10'),
  ex('bb-rdl', 'BARBELL ROMANIAN DEADLIFT', 'strength', 'lower', ['barbell'], 'S', '8-10'),
  ex('goblet-squat', 'GOBLET SQUAT', 'strength', 'lower', ['kb'], 'S', '10-12'),
  ex('kb-sumo-squat', 'KB SUMO SQUAT', 'strength', 'lower', ['kb'], 'S', '10-12'),
  ex('kb-deadlift', 'KB DEADLIFT', 'strength', 'lower', ['kb'], 'S', '12'),
  ex('kb-swing', 'KB SWING', 'strength', 'lower', ['kb'], 'S', '15'),
  ex('db-bulgarian', 'DB BULGARIAN SPLIT SQUAT', 'strength', 'lower', ['bench', 'db'], 'S', '8', true),
  ex('bench-hip-thrust', 'BENCH HIP THRUST', 'strength', 'lower', ['bench'], 'S', '10-12', true),
  ex('db-hip-thrust', 'DB HIP THRUST', 'strength', 'lower', ['bench', 'db'], 'S', '10-12'),
  ex('db-reverse-lunge', 'DB REVERSE LUNGE', 'strength', 'lower', ['db'], 'S', '8', true),
  ex('reverse-lunge-knee', 'REVERSE LUNGE TO HIGH KNEE', 'strength', 'lower', [], 'S', '8', true),
  ex('db-walking-lunge', 'DB WALKING LUNGE', 'strength', 'lower', ['db'], 'lane', '12 M'),
  ex('box-step-up', 'BOX STEP UP', 'strength', 'lower', ['plyo'], 'S', '8', true),
  ex('db-step-up', 'DB BOX STEP UP', 'strength', 'lower', ['plyo', 'db'], 'S', '8', true),
  ex('db-rdl', 'DB ROMANIAN DEADLIFT', 'strength', 'lower', ['db'], 'S', '10-12'),
  ex('front-lunge', 'FRONT LUNGES', 'strength', 'lower', [], 'L', '10', true),
  ex('glute-bridge', 'GLUTE BRIDGE', 'strength', 'lower', ['mat'], 'M', '15'),
  ex('hamstring-curl', 'HAMSTRING CURLS', 'strength', 'lower', ['mat'], 'M', '12'),
  ex('wall-sit', 'WALL SIT', 'strength', 'lower', [], 'S', '0:40'),
  ex('squat-jumps', 'SQUAT JUMPS', 'strength', 'lower', [], 'S', '10'),
  ex('broad-jumps', 'BROAD JUMPS', 'strength', 'lower', [], 'L', '6'),
  ex('box-jumps', 'BOX JUMPS', 'strength', 'lower', ['plyo'], 'S', '8'),
  ex('skaters', 'SKATER JUMPS', 'strength', 'lower', [], 'L', '10 L|R'),

  // ---- upper body, strength ----
  ex('db-bench-press', 'DB BENCH PRESS', 'strength', 'upper', ['bench', 'db'], 'S', '8-12'),
  ex('bb-bench-press', 'BARBELL BENCH PRESS', 'strength', 'upper', ['barbell', 'bench'], 'S', '8-10'),
  ex('db-shoulder-press', 'DB SHOULDER PRESS', 'strength', 'upper', ['db'], 'S', '8-12'),
  ex('bb-ohp', 'BARBELL OVERHEAD PRESS', 'strength', 'upper', ['barbell'], 'S', '8-10'),
  ex('plate-press', 'PLATE OVERHEAD PRESS', 'strength', 'upper', ['plate'], 'S', '10-12'),
  ex('db-row', 'DB ROW', 'strength', 'upper', ['db'], 'S', '10', true),
  ex('bb-row', 'BARBELL BENT OVER ROW', 'strength', 'upper', ['barbell'], 'S', '8-10'),
  ex('renegade-row', 'DB RENEGADE ROW', 'strength', 'upper', ['db'], 'M', '6', true),
  ex('pull-ups', 'PULL-UPS (OR TRX ROWS)', 'strength', 'upper', ['pullup'], 'none', '6-10'),
  ex('push-ups', 'PUSH-UPS', 'strength', 'upper', [], 'M', '10-15'),
  ex('incline-push-ups', 'INCLINE PUSH-UPS', 'strength', 'upper', ['bench'], 'M', '12-15'),
  ex('bench-dips', 'BENCH DIPS', 'strength', 'upper', ['bench'], 'S', '10-12'),
  ex('db-curl', 'DB BICEP CURLS', 'strength', 'upper', ['db'], 'S', '10-12'),
  ex('db-lateral', 'DB LATERAL RAISES', 'strength', 'upper', ['db'], 'S', '12'),
  ex('db-floor-press', 'DB FLOOR PRESS', 'strength', 'upper', ['db', 'mat'], 'M', '10-12'),

  // ---- core and full body, strength ----
  ex('weighted-crunch', 'WEIGHTED CRUNCHES', 'strength', 'core', ['db'], 'M', '12-15'),
  ex('plank', 'PLANK', 'strength', 'core', [], 'M', '0:40'),
  ex('russian-twist', 'RUSSIAN TWIST', 'strength', 'core', ['db'], 'S', '20'),
  ex('sit-ups', 'SIT-UPS', 'strength', 'core', ['mat'], 'M', '15'),
  ex('hollow-hold', 'HOLLOW HOLD', 'strength', 'core', ['mat'], 'M', '0:30'),
  ex('dead-bug', 'DEAD BUGS', 'strength', 'core', ['mat'], 'M', '12 L|R'),
  ex('man-maker', 'MAN MAKER', 'strength', 'full', ['db'], 'M', '6'),
  ex('db-thruster', 'DB THRUSTER', 'strength', 'full', ['db'], 'S', '10'),
  ex('kb-clean-press', 'KB CLEAN AND PRESS', 'strength', 'full', ['kb'], 'S', '8', true),
  ex('plate-to-overhead', 'PLATE TO OVERHEAD', 'strength', 'full', ['plate'], 'S', '12'),

  // ---- cardio ----
  ex('row', 'ROW', 'cardio', 'full', ['rowerg'], 'none', '250 M'),
  ex('skierg', 'SKIERG', 'cardio', 'full', ['skierg'], 'none', '250 M'),
  ex('bikeerg', 'BIKEERG', 'cardio', 'full', ['bikeerg'], 'none', '15 CAL'),
  ex('echo-bike', 'ECHO BIKE', 'cardio', 'full', ['echo'], 'none', '15 CAL'),
  ex('run', 'RUN (CURVED RUNNER)', 'cardio', 'full', ['runner'], 'none', '200 M'),
  ex('burpees', 'BURPEES', 'cardio', 'full', [], 'M', '10'),
  ex('burpee-box-jump', 'BURPEE BOX JUMPS', 'cardio', 'full', ['plyo'], 'M', '8'),
  ex('burpee-broad-jump', 'BURPEE BROAD JUMPS', 'cardio', 'full', [], 'lane', '12 M'),
  ex('mountain-climbers', 'MOUNTAIN CLIMBERS', 'cardio', 'core', [], 'M', '0:40'),
  ex('jumping-jacks', 'JUMPING JACKS', 'cardio', 'full', [], 'S', '40'),
  ex('wall-balls', 'WALL BALLS', 'cardio', 'full', ['wallball'], 'none', '25 REPS'),
  ex('sled-push', 'SLED PUSH', 'cardio', 'lower', ['sled'], 'none', '12 M'),
  ex('sled-pull', 'SLED PULL', 'cardio', 'upper', ['sled'], 'none', '12 M'),
  ex('farmers-carry', 'FARMERS CARRY', 'cardio', 'full', ['kb'], 'lane', '2 x 12 M'),
  { ...ex('run-outside', 'RUN OUTSIDE', 'cardio', 'full', [], 'none', '400 M'), outside: true },
]

export const exerciseById = (id: string) => EXERCISES.find((e) => e.id === id)

export type Filter = {
  kind: 'strength' | 'cardio' | 'any'
  /** Equipment this station has: an exercise's `needs` must all be in here. */
  needs: Need[]
  space: Space
  /** Lower/upper focus: only strength is filtered by it (cardio is free). */
  focus: 'lower' | 'upper' | null
  /** The workout runs outside, so outside-only exercises are allowed. */
  outside?: boolean
}

/** Can `e` go in a slot described by `f`? */
export function compatible(e: Exercise, f: Filter): boolean {
  if (e.outside && !f.outside) return false
  if (f.kind !== 'any' && e.kind !== f.kind) return false
  if (!e.needs.every((n) => f.needs.includes(n))) return false
  if (!spaceFits(e.space, f.space)) return false
  if (f.focus && e.kind === 'strength') return e.area === f.focus || e.area === 'core' || e.area === 'full'
  return true
}
