import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { ExerciseData } from '../types'
import { SetRow } from './set-row'

interface ExerciseItemProps {
  exercise: ExerciseData
  isAddingSet: boolean
  repCount: string
  weight: string
  isSubmitting: boolean
  onAddSet: (exerciseId: number, workoutExerciseId: number) => void
  onDeleteSet: (setId: number, workoutExerciseId: number, isLastSet: boolean) => void
  onEditSet: (setId: number, payload: { rep_count?: number; weight?: number; duration_sec?: number }) => Promise<void>
  onRepCountChange: (v: string) => void
  onWeightChange: (v: string) => void
  onSubmitSet: () => void
  onCancelAdd: () => void
}

export function ExerciseItem({
  exercise,
  isAddingSet,
  repCount,
  weight,
  isSubmitting,
  onAddSet,
  onDeleteSet,
  onEditSet,
  onRepCountChange,
  onWeightChange,
  onSubmitSet,
  onCancelAdd,
}: ExerciseItemProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{exercise.name}</h3>
        {!isAddingSet && (
          <button
            type="button"
            onClick={() => onAddSet(exercise.exercise_id, exercise.workout_exercise_id)}
            className="text-sm text-primary hover:underline"
          >
            + Add Set
          </button>
        )}
      </div>

      <div className="flex flex-col">
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.id}
            set={set}
            index={index}
            tracking_type={exercise.tracking_type}
            onDelete={() =>
              onDeleteSet(set.id, exercise.workout_exercise_id, exercise.sets.length === 1)
            }
            onEdit={(setId, payload) => onEditSet(setId, payload)}
          />
        ))}
        <div className="mt-3 flex flex-col border-t pt-2">
          <span className="text-xs font-medium uppercase tracking-widest text-gray-400">Volume</span>
          <span className="text-lg font-bold text-gray-900">
            {exercise.sets.reduce((total, set) => total + set.rep_count * set.weight, 0)}
            <span className="ml-1 text-sm font-normal text-gray-500">kg</span>
          </span>
        </div>
      </div>

      {isAddingSet && (
        <div className="flex flex-col gap-2 border-t pt-2">
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-muted-foreground">Weight (kg)</label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => onWeightChange(e.target.value)}
                placeholder="0"
                className="h-8"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-muted-foreground">Reps</label>
              <Input
                type="number"
                value={repCount}
                onChange={(e) => onRepCountChange(e.target.value)}
                placeholder="0"
                className="h-8"
              />
            </div>
            <Button size="sm" onClick={onSubmitSet} disabled={isSubmitting} className="h-8">
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelAdd}
              disabled={isSubmitting}
              className="h-8"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
