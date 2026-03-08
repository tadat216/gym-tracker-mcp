# Workout Log Feature — Design

**Date:** 2026-03-08

## Overview

Add a "Workout Log" section to the app with a monthly calendar view and a per-day workout logging page.

## Requirements

- Sidebar entry "Workout Log" alongside "Exercise Library"
- Calendar page (`/workout-log`) showing the current month; days with a workout marked with a check dot
- Clicking a date navigates to `/workout-log/:date` (ISO 8601, e.g. `2026-03-08`)
- Workout log detail page: list exercises + sets logged for that day
- Add exercise via muscle-group → exercise accordion (default open)
- Add sets one at a time: submit reps + weight → set saved → form resets
- Lazy workout creation: `POST /api/workouts` only on first set submission
- Delete individual sets; deleting the last set of an exercise also deletes the workout_exercise

## Routing

```
/                      → redirect to /workout-log
/exercise-library      → ExerciseLibrary (existing)
/workout-log           → WorkoutCalendar
/workout-log/:date     → WorkoutLogDetail
```

`App.tsx` becomes a layout shell with `<Outlet />`. Sidebar uses `<NavLink>` for active state.

## Calendar Page (`/workout-log`)

- Component: `workout-calendar/`
- Fetches `GET /api/workouts/calendar?month=X&year=Y` for current month
- Uses shadcn `Calendar` component (install via `npx shadcn add calendar`)
- Workout days rendered with a green check dot via `react-day-picker` modifiers
- Month navigation re-fetches calendar data
- Date click → `navigate('/workout-log/2026-03-08')`

## Workout Log Detail Page (`/workout-log/:date`)

- Component: `workout-log-detail/`
- Reads `date` from URL params
- If workout exists: fetch `GET /api/workouts/:id` for exercises + sets
- If no workout: empty state, no DB call yet

### Layout

```
← Back    March 8, 2026
─────────────────────────────
Bench Press
  Set 1  80kg  10 reps   [x]
  [+ Add Set]
─────────────────────────────
[+ Add Exercise]
─────────────────────────────
▼ Chest   (accordion — opens when adding)
   ├─ Bench Press
   └─ Incline Press
```

### Add Exercise Flow

1. Click `[+ Add Exercise]` → muscle group accordion opens
2. Select exercise → reps + weight form appears
3. Submit → lazy-create workout if needed → save set → exercise appears in list
4. Accordion closes; `[+ Add Exercise]` ready for next

### Lazy Creation Sequence

1. `POST /api/workouts { date }` → `workout_id`
2. `POST /api/workout-exercises { workout_id, exercise_id }` → `workout_exercise_id`
3. `POST /api/sets { workout_exercise_id, rep_count, weight }` → set saved
4. Invalidate / re-fetch workout detail

### Delete Set

- `DELETE /api/sets/:id`
- If last set for that exercise → also `DELETE /api/workout-exercises/:id`
- Empty workout (no exercises) stays in DB — no auto-cleanup

## Component Structure

```
components/
  workout-calendar/
    types.ts
    hooks.ts          ← calendar data + month navigation state
    views/
      main.tsx        ← shadcn Calendar with workout day modifiers
      index.ts
    container.tsx     ← composes hook + view, navigate on date click
    index.ts

  workout-log-detail/
    types.ts
    hooks.ts          ← fetch workout, add/delete set, accordion state
    views/
      main.tsx              ← page layout
      exercise-item.tsx     ← one exercise + sets + [Add Set]
      set-row.tsx           ← single set row + delete button
      add-exercise-form.tsx ← muscle group accordion + reps/weight form
      index.ts
    container.tsx
    index.ts
```

## API Hooks Used (all pre-generated)

| Hook | Purpose |
|------|---------|
| `useGetCalendarApiWorkoutsCalendarGet` | Calendar month data |
| `useGetWorkoutDetailApiWorkoutsWorkoutIdGet` | Workout exercises + sets |
| `useCreateWorkoutApiWorkoutsPost` | Lazy workout creation |
| `useCreateWorkoutExercise*` | Add exercise to workout |
| `useCreateSet*` | Add a set |
| `useDeleteSet*` | Delete a set |
| `useDeleteWorkoutExercise*` | Delete exercise (last set removed) |
| `useListMuscleGroupsApiMuscleGroupsGet` | Accordion muscle groups |
| `useListExercisesApiExercisesGet` | Exercises per muscle group |

## Calendar Data Strategy

The calendar page passes `workout_id` as router state when navigating to the detail page. If the user visits the URL directly (no state), the detail page calls `GET /api/workouts/calendar` for that month to look up the workout_id.
