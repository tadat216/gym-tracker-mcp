import type { Exercise } from "../../types"

export type { Exercise }

export interface ExerciseRowReadViewProps {
  exercise: Exercise
  onEdit: () => void
  onDelete: () => void
}

export interface ExerciseRowEditViewProps {
  name: string
  vnName: string
  isSaving: boolean
  onNameChange: (v: string) => void
  onVnNameChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
}
