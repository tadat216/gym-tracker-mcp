import type { MuscleGroup, Exercise } from "../types"

export type { MuscleGroup, Exercise }

export interface MuscleGroupAccordionViewProps {
  muscleGroup: MuscleGroup
  exercises: Exercise[]
  allMuscleGroups: MuscleGroup[]
  // Header edit state
  isEditing: boolean
  editName: string
  editVnName: string
  isSaving: boolean
  onEditStart: () => void
  onEditNameChange: (v: string) => void
  onEditVnNameChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  // Delete
  onDeleteClick: () => void
  // Add exercise inline form
  isAddingExercise: boolean
  newExerciseName: string
  newExerciseVnName: string
  isCreatingExercise: boolean
  onAddExercise: () => void
  onCancelAddExercise: () => void
  onNewExerciseNameChange: (v: string) => void
  onNewExerciseVnNameChange: (v: string) => void
  onCreateExercise: () => void
}
