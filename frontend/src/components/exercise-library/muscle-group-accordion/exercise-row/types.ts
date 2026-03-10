import type { Exercise, MuscleGroup } from "../../types"

export type { Exercise, MuscleGroup }

export interface ExerciseRowReadViewProps {
  exercise: Exercise
  onEdit: () => void
  onDelete: () => void
}

export interface ExerciseRowEditViewProps {
  name: string
  vnName: string
  muscleGroupName: string
  allMuscleGroups: MuscleGroup[]
  isSaving: boolean
  onNameChange: (v: string) => void
  onVnNameChange: (v: string) => void
  onMuscleGroupChange: (name: string | null) => void
  onSave: () => void
  onCancel: () => void
}
