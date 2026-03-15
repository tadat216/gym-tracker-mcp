import { TrackingType } from '../../api/model/trackingType'

export interface SetData {
  id: number
  rep_count?: number
  weight?: number
  duration_sec?: number
}

export interface ExerciseData {
  workout_exercise_id: number
  exercise_id: number
  name: string
  vn_name: string
  tracking_type: TrackingType
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
  tracking_type: TrackingType
}
