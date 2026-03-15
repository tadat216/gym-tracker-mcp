import type { TrackingType } from "@/api/model/trackingType"

// Domain types (cast from API unknown responses)
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
  tracking_type: TrackingType
}

// View prop types
export interface ExerciseLibraryViewProps {
  muscleGroups: MuscleGroup[]
  exercises: Exercise[]
  isAdding: boolean
  isCreating: boolean
  newName: string
  newVnName: string
  onAdd: () => void
  onCancelAdd: () => void
  onCreate: () => void
  onDelete: (id: number) => void
  onNewNameChange: (v: string) => void
  onNewVnNameChange: (v: string) => void
}
