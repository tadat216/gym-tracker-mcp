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
  trackingType: string
  isSaving: boolean
  onNameChange: (v: string) => void
  onVnNameChange: (v: string) => void
  onMuscleGroupChange: (name: string | null) => void
  onTrackingTypeChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}
