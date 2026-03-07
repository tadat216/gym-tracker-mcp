# Exercise Library CRUD UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CRUD management page for muscle groups and exercises with inline editing, accordion layout, and a shadcn sidebar — mobile-responsive.

**Architecture:** App shell wraps a shadcn Sidebar + main content area. The ExerciseLibrary page fetches all muscle groups and exercises once, filters client-side per accordion. All edits are inline (no dialogs), deletes use AlertDialog confirmation.

**Tech Stack:** React 19, shadcn/ui (Sidebar, Accordion, Input, AlertDialog), TanStack Query v5, orval-generated hooks, Tailwind v4.

**Design doc:** `docs/plans/2026-03-08-exercise-library-crud-design.md`

---

## Important Notes

- No test framework is configured — skip test steps, commit after each working unit.
- All orval-generated hooks return `unknown` response types. Cast to local types defined in `types.ts`.
- Run `cd frontend && npm run dev` to verify UI in browser at http://localhost:5173. Backend must be running on port 8000.
- All commands run from the repo root unless noted.
- The `frontend-component-structure` skill defines the hooks/view/container pattern used here.

---

### Task 1: Install shadcn Components

**Files:**
- Modify: `frontend/src/components/ui/` (shadcn auto-generates)

**Step 1: Install all needed components at once**

```bash
cd frontend && npx shadcn@latest add sidebar accordion input label alert-dialog
```

Accept all prompts. This installs components into `frontend/src/components/ui/`.

**Step 2: Verify files exist**

```bash
ls frontend/src/components/ui/
```

Expected output includes: `accordion.tsx`, `alert-dialog.tsx`, `input.tsx`, `label.tsx`, `sidebar.tsx`

**Step 3: Commit**

```bash
git add frontend/src/components/ui/ frontend/src/lib/ frontend/components.json
git commit -m "feat: install shadcn sidebar, accordion, input, label, alert-dialog"
```

---

### Task 2: Create App Shell with Sidebar

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/components/app-sidebar/index.tsx`

**Step 1: Create AppSidebar**

Create `frontend/src/components/app-sidebar/index.tsx`:

```tsx
import { Dumbbell } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <span className="font-semibold text-lg">Gym Tracker</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <Dumbbell className="h-4 w-4" />
                  <span>Exercise Library</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
```

**Step 2: Replace App.tsx with sidebar shell**

Replace `frontend/src/App.tsx` entirely:

```tsx
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="font-medium">Exercise Library</span>
        </header>
        <main className="flex-1 p-4">
          {/* ExerciseLibrary will go here in Task 6 */}
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
```

Note: `Separator` may need installing: `cd frontend && npx shadcn@latest add separator`

**Step 3: Remove App.css import and default styles**

In `frontend/src/App.tsx`, ensure there is no `import './App.css'`. Delete or clear `frontend/src/App.css` content to avoid style conflicts.

**Step 4: Start dev server and verify sidebar renders**

```bash
cd frontend && npm run dev
```

Open http://localhost:5173. You should see a sidebar on the left with "Gym Tracker" header and "Exercise Library" nav item. On mobile width, the sidebar should collapse (hamburger trigger visible).

**Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/App.css frontend/src/components/app-sidebar/
git commit -m "feat: add app shell with shadcn sidebar layout"
```

---

### Task 3: Define Types and ExerciseLibrary Hooks

**Files:**
- Create: `frontend/src/components/exercise-library/types.ts`
- Create: `frontend/src/components/exercise-library/hooks.ts`

**Step 1: Create types.ts**

Create `frontend/src/components/exercise-library/types.ts`:

```ts
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

**Step 2: Create hooks.ts**

Create `frontend/src/components/exercise-library/hooks.ts`:

```ts
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useListMuscleGroupsApiMuscleGroupsGet,
  getListMuscleGroupsApiMuscleGroupsGetQueryKey,
  useCreateMuscleGroupApiMuscleGroupsPost,
  useDeleteMuscleGroupApiMuscleGroupsMuscleGroupIdDelete,
} from "@/api/muscle-groups/muscle-groups"
import {
  useListExercisesApiExercisesGet,
  getListExercisesApiExercisesGetQueryKey,
} from "@/api/exercises/exercises"
import type { MuscleGroup, Exercise } from "./types"

export function useExerciseLibrary() {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)

  const { data: rawMuscleGroups, isLoading: loadingGroups } =
    useListMuscleGroupsApiMuscleGroupsGet()
  const { data: rawExercises, isLoading: loadingExercises } =
    useListExercisesApiExercisesGet()

  const muscleGroups = (rawMuscleGroups as MuscleGroup[] | undefined) ?? []
  const exercises = (rawExercises as Exercise[] | undefined) ?? []

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListMuscleGroupsApiMuscleGroupsGetQueryKey() })
    queryClient.invalidateQueries({ queryKey: getListExercisesApiExercisesGetQueryKey() })
  }

  const createMutation = useCreateMuscleGroupApiMuscleGroupsPost({
    mutation: { onSuccess: () => { invalidateAll(); setIsAdding(false) } },
  })

  const deleteMutation = useDeleteMuscleGroupApiMuscleGroupsMuscleGroupIdDelete({
    mutation: { onSuccess: invalidateAll },
  })

  const handleCreate = (name: string, vn_name: string) => {
    createMutation.mutate({ data: { name, vn_name } })
  }

  const handleDelete = (muscleGroupId: number) => {
    deleteMutation.mutate({ muscleGroupId })
  }

  return {
    muscleGroups,
    exercises,
    isLoading: loadingGroups || loadingExercises,
    isAdding,
    setIsAdding,
    handleCreate,
    handleDelete,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/exercise-library/types.ts frontend/src/components/exercise-library/hooks.ts
git commit -m "feat: add exercise library types and data-fetching hook"
```

---

### Task 4: Build ExerciseRow

**Files:**
- Create: `frontend/src/components/exercise-library/muscle-group-accordion/exercise-row/view.tsx`
- Create: `frontend/src/components/exercise-library/muscle-group-accordion/exercise-row/index.tsx`

**Step 1: Create exercise-row/view.tsx**

Create `frontend/src/components/exercise-library/muscle-group-accordion/exercise-row/view.tsx`:

```tsx
import { Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Exercise } from "../../types"

interface ExerciseRowReadProps {
  exercise: Exercise
  onEdit: () => void
  onDelete: () => void
}

interface ExerciseRowEditProps {
  name: string
  vnName: string
  onNameChange: (v: string) => void
  onVnNameChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export function ExerciseRowRead({ exercise, onEdit, onDelete }: ExerciseRowReadProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 px-3 rounded-md hover:bg-muted/50 group">
      <span className="flex-1 text-sm font-medium">{exercise.name}</span>
      <span className="flex-1 text-sm text-muted-foreground">{exercise.vn_name}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function ExerciseRowEdit({
  name,
  vnName,
  onNameChange,
  onVnNameChange,
  onSave,
  onCancel,
  isSaving,
}: ExerciseRowEditProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 py-2 px-3">
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Name (English)"
        className="flex-1 h-8 text-sm"
        disabled={isSaving}
      />
      <Input
        value={vnName}
        onChange={(e) => onVnNameChange(e.target.value)}
        placeholder="Tên tiếng Việt"
        className="flex-1 h-8 text-sm"
        disabled={isSaving}
      />
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onSave} disabled={isSaving}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancel} disabled={isSaving}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Create exercise-row/index.tsx (container)**

Create `frontend/src/components/exercise-library/muscle-group-accordion/exercise-row/index.tsx`:

```tsx
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useUpdateExerciseApiExercisesExerciseIdPatch,
  useDeleteExerciseApiExercisesExerciseIdDelete,
  getListExercisesApiExercisesGetQueryKey,
} from "@/api/exercises/exercises"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ExerciseRowRead, ExerciseRowEdit } from "./view"
import type { Exercise } from "../../types"

interface ExerciseRowProps {
  exercise: Exercise
}

export function ExerciseRow({ exercise }: ExerciseRowProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [name, setName] = useState(exercise.name)
  const [vnName, setVnName] = useState(exercise.vn_name)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListExercisesApiExercisesGetQueryKey() })

  const updateMutation = useUpdateExerciseApiExercisesExerciseIdPatch({
    mutation: { onSuccess: () => { invalidate(); setIsEditing(false) } },
  })

  const deleteMutation = useDeleteExerciseApiExercisesExerciseIdDelete({
    mutation: { onSuccess: invalidate },
  })

  const handleSave = () => {
    if (!name.trim()) return
    updateMutation.mutate({ exerciseId: exercise.id, data: { name: name.trim(), vn_name: vnName.trim() } })
  }

  const handleCancel = () => {
    setName(exercise.name)
    setVnName(exercise.vn_name)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <ExerciseRowEdit
        name={name}
        vnName={vnName}
        onNameChange={setName}
        onVnNameChange={setVnName}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={updateMutation.isPending}
      />
    )
  }

  return (
    <>
      <ExerciseRowRead
        exercise={exercise}
        onEdit={() => setIsEditing(true)}
        onDelete={() => setShowDeleteConfirm(true)}
      />
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              "{exercise.name}" will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ exerciseId: exercise.id })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/exercise-library/muscle-group-accordion/exercise-row/
git commit -m "feat: add ExerciseRow component with inline edit and delete confirmation"
```

---

### Task 5: Build MuscleGroupAccordion

**Files:**
- Create: `frontend/src/components/exercise-library/muscle-group-accordion/hooks.ts`
- Create: `frontend/src/components/exercise-library/muscle-group-accordion/view.tsx`
- Create: `frontend/src/components/exercise-library/muscle-group-accordion/index.tsx`

**Step 1: Create hooks.ts**

Create `frontend/src/components/exercise-library/muscle-group-accordion/hooks.ts`:

```ts
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useUpdateMuscleGroupApiMuscleGroupsMuscleGroupIdPatch,
  getListMuscleGroupsApiMuscleGroupsGetQueryKey,
} from "@/api/muscle-groups/muscle-groups"
import {
  useCreateExerciseApiExercisesPost,
  getListExercisesApiExercisesGetQueryKey,
} from "@/api/exercises/exercises"
import type { MuscleGroup } from "../types"

export function useMuscleGroupAccordion(muscleGroup: MuscleGroup) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [name, setName] = useState(muscleGroup.name)
  const [vnName, setVnName] = useState(muscleGroup.vn_name)

  const invalidateGroups = () =>
    queryClient.invalidateQueries({ queryKey: getListMuscleGroupsApiMuscleGroupsGetQueryKey() })
  const invalidateExercises = () =>
    queryClient.invalidateQueries({ queryKey: getListExercisesApiExercisesGetQueryKey() })

  const updateMutation = useUpdateMuscleGroupApiMuscleGroupsMuscleGroupIdPatch({
    mutation: {
      onSuccess: () => {
        invalidateGroups()
        setIsEditing(false)
      },
    },
  })

  const createExerciseMutation = useCreateExerciseApiExercisesPost({
    mutation: {
      onSuccess: () => {
        invalidateExercises()
        setIsAddingExercise(false)
      },
    },
  })

  const handleSave = () => {
    if (!name.trim()) return
    updateMutation.mutate({
      muscleGroupId: muscleGroup.id,
      data: { name: name.trim(), vn_name: vnName.trim() },
    })
  }

  const handleCancel = () => {
    setName(muscleGroup.name)
    setVnName(muscleGroup.vn_name)
    setIsEditing(false)
  }

  const handleCreateExercise = (exName: string, exVnName: string) => {
    if (!exName.trim()) return
    createExerciseMutation.mutate({
      data: { name: exName.trim(), vn_name: exVnName.trim(), muscle_group_id: muscleGroup.id },
    })
  }

  return {
    isEditing,
    setIsEditing,
    isAddingExercise,
    setIsAddingExercise,
    name,
    setName,
    vnName,
    setVnName,
    handleSave,
    handleCancel,
    handleCreateExercise,
    isSaving: updateMutation.isPending,
    isCreatingExercise: createExerciseMutation.isPending,
  }
}
```

**Step 2: Create view.tsx**

Create `frontend/src/components/exercise-library/muscle-group-accordion/view.tsx`:

```tsx
import { Pencil, Trash2, Check, X, Plus } from "lucide-react"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExerciseRow } from "./exercise-row"
import type { Exercise, MuscleGroup } from "../types"

interface NewExerciseFormProps {
  onSave: (name: string, vnName: string) => void
  onCancel: () => void
  isSaving: boolean
}

function NewExerciseForm({ onSave, onCancel, isSaving }: NewExerciseFormProps) {
  let name = ""
  let vnName = ""
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 py-2 px-3 border-t">
      <Input
        placeholder="Name (English)"
        className="flex-1 h-8 text-sm"
        onChange={(e) => { name = e.target.value }}
        disabled={isSaving}
        autoFocus
      />
      <Input
        placeholder="Tên tiếng Việt"
        className="flex-1 h-8 text-sm"
        onChange={(e) => { vnName = e.target.value }}
        disabled={isSaving}
      />
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onSave(name, vnName)} disabled={isSaving}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancel} disabled={isSaving}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

interface MuscleGroupHeaderProps {
  muscleGroup: MuscleGroup
  isEditing: boolean
  name: string
  vnName: string
  onNameChange: (v: string) => void
  onVnNameChange: (v: string) => void
  onEdit: () => void
  onDelete: () => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export function MuscleGroupHeader({
  muscleGroup,
  isEditing,
  name,
  vnName,
  onNameChange,
  onVnNameChange,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  isSaving,
}: MuscleGroupHeaderProps) {
  if (isEditing) {
    return (
      <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-2 py-1 pr-2">
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Name (English)"
          className="flex-1 h-8 text-sm"
          disabled={isSaving}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
        <Input
          value={vnName}
          onChange={(e) => onVnNameChange(e.target.value)}
          placeholder="Tên tiếng Việt"
          className="flex-1 h-8 text-sm"
          disabled={isSaving}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex gap-1">
          <Button
            size="icon" variant="ghost" className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onSave() }}
            disabled={isSaving}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon" variant="ghost" className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onCancel() }}
            disabled={isSaving}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center gap-2 min-w-0 pr-2">
      <span className="truncate font-medium">{muscleGroup.name}</span>
      <span className="truncate text-sm text-muted-foreground hidden sm:inline">· {muscleGroup.vn_name}</span>
      <div className="ml-auto flex gap-1 opacity-0 group-hover/trigger:opacity-100 transition-opacity">
        <Button
          size="icon" variant="ghost"
          className="h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8"
          onClick={(e) => { e.stopPropagation(); onEdit() }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon" variant="ghost"
          className="h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

interface MuscleGroupAccordionViewProps {
  muscleGroup: MuscleGroup
  exercises: Exercise[]
  isEditing: boolean
  isAddingExercise: boolean
  name: string
  vnName: string
  onNameChange: (v: string) => void
  onVnNameChange: (v: string) => void
  onEdit: () => void
  onDelete: () => void
  onSave: () => void
  onCancel: () => void
  onAddExercise: () => void
  onCreateExercise: (name: string, vnName: string) => void
  onCancelAddExercise: () => void
  isSaving: boolean
  isCreatingExercise: boolean
}

export function MuscleGroupAccordionView({
  muscleGroup,
  exercises,
  isEditing,
  isAddingExercise,
  name,
  vnName,
  onNameChange,
  onVnNameChange,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onAddExercise,
  onCreateExercise,
  onCancelAddExercise,
  isSaving,
  isCreatingExercise,
}: MuscleGroupAccordionViewProps) {
  return (
    <AccordionItem value={String(muscleGroup.id)} className="border rounded-lg mb-2 px-2">
      <AccordionTrigger className="group/trigger hover:no-underline py-3">
        <MuscleGroupHeader
          muscleGroup={muscleGroup}
          isEditing={isEditing}
          name={name}
          vnName={vnName}
          onNameChange={onNameChange}
          onVnNameChange={onVnNameChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onSave={onSave}
          onCancel={onCancel}
          isSaving={isSaving}
        />
      </AccordionTrigger>
      <AccordionContent>
        <div className="pb-2">
          {exercises.length === 0 && !isAddingExercise && (
            <p className="text-sm text-muted-foreground px-3 py-2">No exercises yet.</p>
          )}
          {exercises.map((ex) => (
            <ExerciseRow key={ex.id} exercise={ex} />
          ))}
          {isAddingExercise && (
            <NewExerciseForm
              onSave={onCreateExercise}
              onCancel={onCancelAddExercise}
              isSaving={isCreatingExercise}
            />
          )}
          {!isAddingExercise && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-8 text-muted-foreground w-full sm:w-auto"
              onClick={onAddExercise}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Exercise
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
```

**Step 3: Create index.tsx (container)**

Create `frontend/src/components/exercise-library/muscle-group-accordion/index.tsx`:

```tsx
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MuscleGroupAccordionView } from "./view"
import { useMuscleGroupAccordion } from "./hooks"
import type { Exercise, MuscleGroup } from "../types"

interface MuscleGroupAccordionProps {
  muscleGroup: MuscleGroup
  exercises: Exercise[]
  onDelete: (id: number) => void
}

export function MuscleGroupAccordion({
  muscleGroup,
  exercises,
  onDelete,
}: MuscleGroupAccordionProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const hook = useMuscleGroupAccordion(muscleGroup)

  return (
    <>
      <MuscleGroupAccordionView
        muscleGroup={muscleGroup}
        exercises={exercises}
        isEditing={hook.isEditing}
        isAddingExercise={hook.isAddingExercise}
        name={hook.name}
        vnName={hook.vnName}
        onNameChange={hook.setName}
        onVnNameChange={hook.setVnName}
        onEdit={() => hook.setIsEditing(true)}
        onDelete={() => setShowDeleteConfirm(true)}
        onSave={hook.handleSave}
        onCancel={hook.handleCancel}
        onAddExercise={() => hook.setIsAddingExercise(true)}
        onCreateExercise={hook.handleCreateExercise}
        onCancelAddExercise={() => hook.setIsAddingExercise(false)}
        isSaving={hook.isSaving}
        isCreatingExercise={hook.isCreatingExercise}
      />
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete muscle group?</AlertDialogTitle>
            <AlertDialogDescription>
              "{muscleGroup.name}" and all its exercises will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(muscleGroup.id); setShowDeleteConfirm(false) }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

**Step 4: Commit**

```bash
git add frontend/src/components/exercise-library/muscle-group-accordion/
git commit -m "feat: add MuscleGroupAccordion with inline edit, exercise list, and delete confirmation"
```

---

### Task 6: Build ExerciseLibrary Page and Wire Into App

**Files:**
- Create: `frontend/src/components/exercise-library/view.tsx`
- Create: `frontend/src/components/exercise-library/index.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Create exercise-library/view.tsx**

Create `frontend/src/components/exercise-library/view.tsx`:

```tsx
import { Plus, Check, X } from "lucide-react"
import { Accordion } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MuscleGroupAccordion } from "./muscle-group-accordion"
import type { Exercise, MuscleGroup } from "./types"

interface NewMuscleGroupFormProps {
  onSave: (name: string, vnName: string) => void
  onCancel: () => void
  isSaving: boolean
}

function NewMuscleGroupForm({ onSave, onCancel, isSaving }: NewMuscleGroupFormProps) {
  let name = ""
  let vnName = ""
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border rounded-lg">
      <Input
        placeholder="Muscle group name (English)"
        className="flex-1 h-9"
        onChange={(e) => { name = e.target.value }}
        disabled={isSaving}
        autoFocus
      />
      <Input
        placeholder="Tên nhóm cơ (tiếng Việt)"
        className="flex-1 h-9"
        onChange={(e) => { vnName = e.target.value }}
        disabled={isSaving}
      />
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => onSave(name, vnName)} disabled={isSaving}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface ExerciseLibraryViewProps {
  muscleGroups: MuscleGroup[]
  exercises: Exercise[]
  isLoading: boolean
  isAdding: boolean
  isCreating: boolean
  onAdd: () => void
  onCancelAdd: () => void
  onCreate: (name: string, vnName: string) => void
  onDelete: (id: number) => void
}

export function ExerciseLibraryView({
  muscleGroups,
  exercises,
  isLoading,
  isAdding,
  isCreating,
  onAdd,
  onCancelAdd,
  onCreate,
  onDelete,
}: ExerciseLibraryViewProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading...</p>
  }

  const exercisesByGroup = (groupId: number) =>
    exercises.filter((e) => e.muscle_group_id === groupId)

  return (
    <div className="space-y-2">
      <Accordion type="multiple" className="w-full">
        {muscleGroups.map((group) => (
          <MuscleGroupAccordion
            key={group.id}
            muscleGroup={group}
            exercises={exercisesByGroup(group.id)}
            onDelete={onDelete}
          />
        ))}
      </Accordion>

      {isAdding ? (
        <NewMuscleGroupForm
          onSave={onCreate}
          onCancel={onCancelAdd}
          isSaving={isCreating}
        />
      ) : (
        <Button variant="outline" className="w-full sm:w-auto" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Muscle Group
        </Button>
      )}
    </div>
  )
}
```

**Step 2: Create exercise-library/index.tsx (container)**

Create `frontend/src/components/exercise-library/index.tsx`:

```tsx
import { useExerciseLibrary } from "./hooks"
import { ExerciseLibraryView } from "./view"

export function ExerciseLibrary() {
  const {
    muscleGroups,
    exercises,
    isLoading,
    isAdding,
    setIsAdding,
    handleCreate,
    handleDelete,
    isCreating,
  } = useExerciseLibrary()

  return (
    <ExerciseLibraryView
      muscleGroups={muscleGroups}
      exercises={exercises}
      isLoading={isLoading}
      isAdding={isAdding}
      isCreating={isCreating}
      onAdd={() => setIsAdding(true)}
      onCancelAdd={() => setIsAdding(false)}
      onCreate={handleCreate}
      onDelete={handleDelete}
    />
  )
}
```

**Step 3: Update App.tsx to render ExerciseLibrary**

Modify `frontend/src/App.tsx` — replace the placeholder `<p>Loading...</p>` in main with:

```tsx
import { ExerciseLibrary } from "@/components/exercise-library"

// Inside <main>:
<main className="flex-1 p-4 max-w-3xl">
  <ExerciseLibrary />
</main>
```

Full updated App.tsx:

```tsx
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { ExerciseLibrary } from "@/components/exercise-library"

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="font-medium">Exercise Library</span>
        </header>
        <main className="flex-1 p-4 max-w-3xl">
          <ExerciseLibrary />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
```

**Step 4: Start backend + frontend and verify end-to-end**

```bash
# Terminal 1 — backend
cd backend && uv run python api.py

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:5173. Verify:
- Sidebar visible on desktop, collapses on mobile
- Muscle groups load as accordion items
- Expanding shows exercises
- Edit/Delete buttons appear on hover
- Inline edit works for both muscle groups and exercises
- Delete shows confirmation dialog
- Add Muscle Group and Add Exercise forms work

**Step 5: Commit**

```bash
git add frontend/src/components/exercise-library/ frontend/src/App.tsx
git commit -m "feat: add ExerciseLibrary CRUD page with accordion layout and inline editing"
```

---

## Done

All tasks complete. The exercise library CRUD UI is fully implemented with:
- shadcn Sidebar (mobile-responsive, collapses to sheet)
- Accordion per muscle group with inline editing
- Exercise rows with inline editing per group
- AlertDialog confirmation for all deletes
- Client-side exercise filtering (single API call)
- Mobile-friendly touch targets and stacked layouts
