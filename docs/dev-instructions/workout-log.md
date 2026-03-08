# Workout Log — Step-by-Step Implementation Guide

Design doc: `docs/plans/2026-03-08-workout-log-design.md`

---

## Before You Start — Know the API shapes

**Calendar response** (`GET /api/workouts/calendar?month=3&year=2026`):
```json
{
  "year": 2026,
  "month": 3,
  "month_name": "March",
  "weeks": [[0,0,0,0,0,1,2], [3,4,5,6,7,8,9], ...],
  "workout_dates": ["2026-03-08", "2026-03-10"]
}
```

**Range response** (`GET /api/workouts/range?start_date=2026-03-08&end_date=2026-03-08`):
```json
[{ "id": 1, "date": "2026-03-08" }]
```

**Workout detail** (`GET /api/workouts/1`):
```json
{
  "id": 1,
  "date": "2026-03-08",
  "exercises": [
    {
      "workout_exercise_id": 1,
      "exercise_id": 5,
      "name": "Bench Press",
      "vn_name": "Đẩy ngực",
      "sets": [
        { "id": 1, "rep_count": 10, "weight": 80 }
      ]
    }
  ]
}
```

**SetCreate body**: `{ workout_exercise_id: number, rep_count: number, weight: number }`

**WorkoutExerciseCreate body**: `{ workout_id: number, exercise_id: number }`

**WorkoutCreate body**: `{ date: string | null }`

---

## Step 1 — Install shadcn Calendar

```bash
cd frontend
npx shadcn add calendar
```

This adds `frontend/src/components/ui/calendar.tsx` and installs `react-day-picker`.

---

## Step 2 — Update Routing in `App.tsx`

Replace the current hardcoded `<ExerciseLibrary />` with an `<Outlet />` and set up nested routes.

**What to do in `App.tsx`:**
- Import `Outlet`, `Navigate`, `Route`, `Routes` from `react-router-dom`
- Replace `<ExerciseLibrary />` with `<Routes>` containing nested routes
- Replace the hardcoded `<span>Exercise Library</span>` header text with a dynamic title (or remove it for now)

**Routes to add:**
```
/exercise-library  →  <ExerciseLibrary />
/workout-log       →  <WorkoutCalendar />   (create in Step 4)
/workout-log/:date →  <WorkoutLogDetail />  (create in Step 5)
/                  →  <Navigate to="/workout-log" replace />
```

Tip: Use `<Routes>` inside the `<SidebarInset>` `<main>` element.

---

## Step 3 — Update Sidebar with NavLinks

**File:** `frontend/src/components/app-sidebar/index.tsx`

**What to do:**
- Import `NavLink` from `react-router-dom`
- Import `CalendarDays` from `lucide-react` (alongside existing `Dumbbell`)
- Replace the single hardcoded `<SidebarMenuButton isActive>` with two `<SidebarMenuButton>` items, each wrapped in `<NavLink>`
- Use the `NavLink`'s `isActive` prop (it's a render prop) to pass `isActive` to `<SidebarMenuButton>`

**Menu items to add:**
```
Exercise Library  →  href="/exercise-library"  icon=<Dumbbell />
Workout Log       →  href="/workout-log"        icon=<CalendarDays />
```

Example pattern for each item:
```tsx
<NavLink to="/exercise-library">
  {({ isActive }) => (
    <SidebarMenuButton isActive={isActive}>
      <Dumbbell />
      <span>Exercise Library</span>
    </SidebarMenuButton>
  )}
</NavLink>
```

---

## Step 4 — Create `workout-calendar` Component

**Directory:** `frontend/src/components/workout-calendar/`

**Files to create:**

### `types.ts`
Define the shape of the calendar API response:
```ts
export interface CalendarData {
  year: number
  month: number
  month_name: string
  workout_dates: string[]   // e.g. ["2026-03-08"]
}
```

### `hooks.ts`
```ts
export function useWorkoutCalendar() { ... }
```

State:
- `currentMonth: Date` — initialized to `new Date()` (today)

API call:
- Use `useGetCalendarApiWorkoutsCalendarGet({ month: currentMonth.getMonth() + 1, year: currentMonth.getFullYear() })`
- Cast the result to `CalendarData`

Return:
- `currentMonth`, `setCurrentMonth`
- `workoutDates: Date[]` — convert `workout_dates` strings to `Date` objects
  Parse safely: `const [y,m,d] = str.split('-').map(Number); return new Date(y, m-1, d)`
- `isLoading`

### `views/main.tsx`
Pure presentational component. Props:
```ts
{
  currentMonth: Date
  workoutDates: Date[]
  isLoading: boolean
  onMonthChange: (month: Date) => void
  onDateSelect: (date: Date | undefined) => void
}
```

Use the shadcn `<Calendar>` component:
- `mode="single"`
- `month={currentMonth}`
- `onMonthChange={onMonthChange}`
- `onSelect={onDateSelect}`
- Use `modifiers={{ hasWorkout: workoutDates }}` to mark workout days
- Use `modifiersClassNames={{ hasWorkout: 'day-has-workout' }}`
- Add a CSS class `.day-has-workout` (in `index.css` or inline style) that shows a small green dot — use `position: relative` on the day cell and `::after` pseudo-element, or just add a colored ring via Tailwind

### `views/index.ts`
```ts
export { WorkoutCalendarView } from './main'
```

### `container.tsx`
- Call `useWorkoutCalendar()`
- `useNavigate()` from react-router-dom
- On date select: `navigate('/workout-log/' + format(date, 'yyyy-MM-dd'))`
  Or manually: `navigate(\`/workout-log/${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}\`)`
- Pass everything to `<WorkoutCalendarView />`

### `index.ts`
```ts
export { WorkoutCalendarContainer as WorkoutCalendar } from './container'
```

---

## Step 5 — Create `workout-log-detail` Component

**Directory:** `frontend/src/components/workout-log-detail/`

This is the most complex component. Build it in layers.

### `types.ts`

```ts
export interface SetData {
  id: number
  rep_count: number
  weight: number
}

export interface ExerciseData {
  workout_exercise_id: number
  exercise_id: number
  name: string
  vn_name: string
  sets: SetData[]
}

export interface WorkoutDetail {
  id: number
  date: string
  exercises: ExerciseData[]
}

export interface MuscleGroup {
  id: number
  name: string
  vn_name: string
}

export interface Exercise {
  id: number
  name: string
  vn_name: string
  muscle_group_id: number
}
```

### `hooks.ts`

This hook orchestrates everything. Signature:
```ts
export function useWorkoutLogDetail(date: string) { ... }
```

**State to manage:**
- `workoutId: number | null` — null if no workout exists for this date yet
- `showAddExercise: boolean` — whether the exercise accordion is open
- `selectedExercise: Exercise | null` — the exercise chosen in the accordion
- `repCount: string`, `weight: string` — form inputs for the set

**Data fetching:**
1. Call `useListWorkoutsInRangeApiWorkoutsRangeGet({ start_date: date, end_date: date })` to find if a workout exists for this date. From the result, extract `workoutId`.
2. Call `useGetWorkoutDetailApiWorkoutsWorkoutIdGet(workoutId!, { query: { enabled: workoutId !== null } })` for the exercises + sets.
3. Call `useListMuscleGroupsApiMuscleGroupsGet()` for the accordion.
4. Call `useListExercisesApiExercisesGet()` for exercises list.

**Mutations:**
- `useCreateWorkoutApiWorkoutsPost` — lazy workout creation
- `useAddExerciseToWorkoutApiWorkoutExercisesPost` — add exercise to workout
- `useLogSetApiSetsPost` — add a set
- `useDeleteWorkoutExerciseDetailApiSetsSetIdDelete` — delete a set (check exact hook name in `sets.ts`)
- Check `workout-exercises.ts` for the delete workout_exercise hook

**`handleSubmitSet` logic** (the core action):
```
async function handleSubmitSet(exerciseId: number):
  1. If workoutId is null:
       POST /api/workouts { date } → get workoutId, save to state
  2. POST /api/workout-exercises { workout_id: workoutId, exercise_id } → get workout_exercise_id
  3. POST /api/sets { workout_exercise_id, rep_count, weight }
  4. Invalidate workout detail query
  5. Reset form: selectedExercise=null, repCount='', weight='', showAddExercise=false
```

Use `queryClient.invalidateQueries` to refresh. The query key for workout detail is:
```ts
getGetWorkoutDetailApiWorkoutsWorkoutIdGetQueryKey(workoutId)
```
Also invalidate the range query key so the detail page re-fetches if needed.

**`handleDeleteSet` logic:**
```
async function handleDeleteSet(setId: number, workoutExerciseId: number, isLastSet: boolean):
  1. DELETE /api/sets/:setId
  2. If isLastSet: DELETE /api/workout-exercises/:workoutExerciseId
  3. Invalidate workout detail query
```

**Return from hook:**
```ts
{
  workout,           // WorkoutDetail | undefined
  isLoading,
  muscleGroups,      // MuscleGroup[]
  exercises,         // Exercise[]
  showAddExercise,
  setShowAddExercise,
  selectedExercise,
  setSelectedExercise,
  repCount,
  setRepCount,
  weight,
  setWeight,
  handleSubmitSet,
  handleDeleteSet,
  isSubmitting,      // boolean - mutation pending state
}
```

### `views/set-row.tsx`

Props: `{ set: SetData, onDelete: () => void }`

Renders: `Set N  Xkg  Y reps  [x]`

The set number isn't in the data — derive it from the array index (passed as prop).

### `views/exercise-item.tsx`

Props:
```ts
{
  exercise: ExerciseData
  onAddSet: (exerciseId: number) => void
  onDeleteSet: (setId: number, workoutExerciseId: number, isLastSet: boolean) => void
}
```

Renders:
```
Exercise Name
  Set 1  80kg  10 reps  [x]
  Set 2  80kg   8 reps  [x]
  [+ Add Set]
```

When `[+ Add Set]` is clicked → call `onAddSet(exercise.exercise_id)`. This should set `selectedExercise` in the parent hook so the reps/weight form appears for this exercise.

### `views/add-exercise-form.tsx`

This shows the muscle group accordion + the reps/weight form.

Props:
```ts
{
  muscleGroups: MuscleGroup[]
  exercises: Exercise[]
  selectedExercise: Exercise | null
  repCount: string
  weight: string
  isSubmitting: boolean
  onSelectExercise: (exercise: Exercise) => void
  onRepCountChange: (v: string) => void
  onWeightChange: (v: string) => void
  onSubmit: () => void
  onCancel: () => void
}
```

Layout:
- If `selectedExercise` is null: show the muscle group accordion (reuse the shadcn `<Accordion>` component)
  - Each `AccordionItem` = one muscle group
  - Inside: list of exercises as clickable buttons → calls `onSelectExercise`
- If `selectedExercise` is set: show the set form
  ```
  Adding set for: Bench Press
  Weight (kg): [_____]
  Reps:        [_____]
  [Submit]  [Cancel]
  ```

### `views/main.tsx`

Props:
```ts
{
  date: string
  workout: WorkoutDetail | undefined
  isLoading: boolean
  muscleGroups: MuscleGroup[]
  exercises: Exercise[]
  showAddExercise: boolean
  selectedExercise: Exercise | null
  repCount: string
  weight: string
  isSubmitting: boolean
  onAddExercise: () => void
  onSelectExercise: (exercise: Exercise) => void
  onRepCountChange: (v: string) => void
  onWeightChange: (v: string) => void
  onSubmitSet: () => void
  onCancelAdd: () => void
  onAddSet: (exerciseId: number) => void
  onDeleteSet: (setId: number, workoutExerciseId: number, isLastSet: boolean) => void
}
```

Layout:
```tsx
<div>
  {/* Header */}
  <div>
    <button onClick={() => navigate(-1)}>← Back</button>
    <h1>{formatDate(date)}</h1>   {/* e.g. "March 8, 2026" */}
  </div>

  {/* Exercise list */}
  {workout?.exercises.map(ex => (
    <ExerciseItem key={ex.workout_exercise_id} ... />
  ))}

  {/* Add exercise button */}
  {!showAddExercise && (
    <button onClick={onAddExercise}>+ Add Exercise</button>
  )}

  {/* Add exercise form (accordion + set form) */}
  {showAddExercise && (
    <AddExerciseForm ... />
  )}
</div>
```

**Date formatting helper** (put inline in main.tsx or in a local helper):
```ts
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}
```

**Auto-open accordion on page load:** In `container.tsx`, after the data loads, if `workout` is undefined OR `workout.exercises.length === 0`, set `showAddExercise = true` automatically.

### `views/index.ts`
```ts
export { WorkoutLogDetailView } from './main'
```

### `container.tsx`
```tsx
export function WorkoutLogDetailContainer() {
  const { date } = useParams<{ date: string }>()
  const hook = useWorkoutLogDetail(date!)

  // Auto-open form when page loads with no exercises
  useEffect(() => {
    if (!hook.isLoading && (!hook.workout || hook.workout.exercises.length === 0)) {
      hook.setShowAddExercise(true)
    }
  }, [hook.isLoading, hook.workout])

  return <WorkoutLogDetailView date={date!} {...hook} ... />
}
```

### `index.ts`
```ts
export { WorkoutLogDetailContainer as WorkoutLogDetail } from './container'
```

---

## Step 6 — Wire Up Routes in `App.tsx`

Import `WorkoutCalendar` and `WorkoutLogDetail` and add them to the routes set up in Step 2.

---

## Step 7 — Add Workout Day Dot Styling

In `frontend/src/index.css`, add styling for workout days in the calendar:

```css
/* Workout day indicator dot */
.rdp-day.day-has-workout {
  position: relative;
}
.rdp-day.day-has-workout::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #22c55e; /* green-500 */
}
```

Note: The exact CSS class names depend on the `react-day-picker` version installed. Inspect the rendered HTML to confirm the class names if the dot doesn't appear.

---

## API Hook Names Reference

All hooks live in `frontend/src/api/`. Exact names to import:

| Action | Hook | File |
|--------|------|------|
| Calendar month data | `useGetCalendarApiWorkoutsCalendarGet` | `workouts/workouts.ts` |
| Find workout by date | `useListWorkoutsInRangeApiWorkoutsRangeGet` | `workouts/workouts.ts` |
| Get workout detail | `useGetWorkoutDetailApiWorkoutsWorkoutIdGet` | `workouts/workouts.ts` |
| Create workout | `useCreateWorkoutApiWorkoutsPost` | `workouts/workouts.ts` |
| Add exercise to workout | `useAddExerciseToWorkoutApiWorkoutExercisesPost` | `workout-exercises/workout-exercises.ts` |
| Log a set | `useLogSetApiSetsPost` | `sets/sets.ts` |
| Delete a set | `useDeleteWorkoutExerciseDetailApiSetsSetIdDelete` *(verify name)* | `sets/sets.ts` |
| Delete workout_exercise | *(check workout-exercises.ts for delete hook)* | `workout-exercises/workout-exercises.ts` |
| List muscle groups | `useListMuscleGroupsApiMuscleGroupsGet` | `muscle-groups/muscle-groups.ts` |
| List exercises | `useListExercisesApiExercisesGet` | `exercises/exercises.ts` |

> Tip: Open each `.ts` file and search for `export const use` to find all hooks and their exact names.

---

## Build Order Recommendation

1. Step 1 + 2 + 3 — Get routing working first (sidebar links + page switching)
2. Step 4 — Calendar page (simpler, read-only)
3. Step 5 in order: `types.ts` → `set-row.tsx` → `exercise-item.tsx` → `add-exercise-form.tsx` → `main.tsx` → `hooks.ts` → `container.tsx`
4. Step 6 + 7 — Wire up and style

Start with hardcoded/fake data in the views before wiring up the hooks. It's easier to build the UI first and add real data second.
