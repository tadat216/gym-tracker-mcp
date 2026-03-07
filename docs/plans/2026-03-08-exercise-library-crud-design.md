# Exercise Library CRUD UI — Design

**Date:** 2026-03-08
**Status:** Approved

## Overview

A CRUD management page for muscle groups and exercises, accessible via a shadcn sidebar. Muscle groups render as accordions; exercises are listed inside each accordion panel. All create/edit interactions are inline — no dialogs or drawers.

## App Shell

The app gets a persistent layout with a shadcn `Sidebar` component on the left and the main content area on the right.

- **Desktop:** sidebar visible, content fills remaining width.
- **Mobile:** sidebar collapses to a hamburger-triggered sheet (shadcn `Sidebar` handles this via `useSidebar` + `SidebarTrigger`). Content fills full screen width.

`App.tsx` becomes the shell: `SidebarProvider` > `AppSidebar` + main content. No routing library needed yet — only one page.

## Exercise Library Page

### Muscle Group Accordion

- Uses shadcn `Accordion` with `type="multiple"` so multiple groups can be open simultaneously.
- Each accordion **trigger** (header) shows:
  - Muscle group `name` and `vn_name` (e.g. "Chest · Ngực")
  - **Edit** and **Delete** icon buttons, right-aligned
- **Inline edit mode**: clicking Edit replaces the trigger text with two `Input` fields (`name`, `vn_name`) and **Save** / **Cancel** buttons. The accordion stays open/closed as-is.
- **Delete**: opens a shadcn `AlertDialog` confirmation. On confirm, calls DELETE API and invalidates the muscle-groups query.
- **Add Muscle Group**: a `+ Add Muscle Group` button below the accordion. Clicking it appends a new inline form row (two inputs + Save/Cancel) below the last accordion item. Saving calls POST and refreshes the list.

### Exercise Rows (inside accordion panel)

Each exercise is a row with:
- `name` and `vn_name` displayed side-by-side (desktop) or stacked (mobile)
- **Edit** and **Delete** icon buttons

**Inline edit mode**: clicking Edit turns the row into two inputs + Save/Cancel. `muscle_group_id` is implicit from the parent accordion.

**Add Exercise**: a `+ Add Exercise` button at the bottom of each accordion panel. Clicking it appends an inline form row scoped to that muscle group.

**Delete**: same `AlertDialog` pattern as muscle groups.

## Mobile Responsiveness

- Sidebar collapses to off-canvas sheet on mobile; toggled by a `SidebarTrigger` (hamburger icon) in the top-left of the header.
- Exercise rows switch from horizontal layout to stacked layout on small screens (`flex-col sm:flex-row`).
- Edit inputs take full width on mobile.
- Touch targets for Edit/Delete buttons are at least 44px.
- Accordion trigger text truncates with `truncate` class to prevent overflow on narrow screens.

## Component Structure

```
src/
  components/
    app-sidebar/
      index.tsx                      ← AppSidebar component
    exercise-library/
      index.tsx                      ← container (fetches muscle groups, owns add state)
      view.tsx                       ← pure layout: accordion list + add button
      hooks.ts                       ← useExerciseLibrary()
      types.ts                       ← MuscleGroupWithEditState, etc.
      muscle-group-accordion/
        index.tsx                    ← container (owns edit state per muscle group)
        view.tsx                     ← accordion item + exercise list
        hooks.ts                     ← useMuscleGroupAccordion()
        exercise-row/
          index.tsx                  ← container (owns edit state per exercise)
          view.tsx                   ← single exercise row (read or edit mode)
```

## shadcn Components to Install

- `sidebar`
- `accordion`
- `input`
- `label`
- `alert-dialog`
- `separator` (optional, for row dividers)

## Data Flow

```
useExerciseLibrary (hooks.ts)
  └─ useListMuscleGroupsApiMuscleGroupsGet()   ← all muscle groups
  └─ useListExercisesApiExercisesGet()         ← all exercises (no filter param needed;
                                                  filter by muscle_group_id client-side)
  └─ useCreateMuscleGroupApiMuscleGroupsPost()
  └─ useDeleteMuscleGroupApiMuscleGroupsMuscleGroupIdDelete()

useMuscleGroupAccordion (hooks.ts)
  └─ useUpdateMuscleGroupApiMuscleGroupsMuscleGroupIdPatch()
  └─ useCreateExerciseApiExercisesPost()
  └─ useDeleteMuscleGroupApiMuscleGroupsMuscleGroupIdDelete()

useExerciseRow (exercise-row/hooks.ts — if needed, else inline)
  └─ useUpdateExerciseApiExercisesExerciseIdPatch()
  └─ useDeleteExerciseApiExercisesExerciseIdDelete()
```

All mutations call `queryClient.invalidateQueries` on success to refresh the list.

## Key Decisions

- **Client-side exercise filtering** — fetch all exercises once, filter by `muscle_group_id` in the hook. Avoids N+1 API calls (one per accordion).
- **Inline editing, no dialogs** — forms are tiny (2 fields), dialogs add unnecessary overhead.
- **shadcn Sidebar** — handles mobile collapse natively; no custom drawer logic needed.
- **AlertDialog for deletes** — prevents accidental data loss, especially important on mobile where mis-taps are common.
