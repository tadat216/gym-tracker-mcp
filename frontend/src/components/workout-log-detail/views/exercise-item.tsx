import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { ExerciseData, TrackingType } from '../types'
import { SetRow } from './set-row'

interface ExerciseItemProps {
  exercise: ExerciseData
  isAddingSet: boolean
  addingTrackingType?: TrackingType
  repCount: string
  weight: string
  durationSec: string
  isSubmitting: boolean
  onAddSet: (exerciseId: number, workoutExerciseId: number) => void
  onDeleteSet: (setId: number, workoutExerciseId: number, isLastSet: boolean) => void
  onEditSet: (setId: number, payload: { rep_count?: number; weight?: number; duration_sec?: number }) => Promise<void>
  onRepCountChange: (v: string) => void
  onWeightChange: (v: string) => void
  onDurationSecChange: (v: string) => void
  onSubmitSet: () => void
  onCancelAdd: () => void
}

function formatDuration(totalSec: number): string {
  if (totalSec < 60) return `${totalSec}s`
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60
  return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`
}

export function ExerciseItem({
  exercise,
  isAddingSet,
  addingTrackingType,
  repCount,
  weight,
  durationSec,
  isSubmitting,
  onAddSet,
  onDeleteSet,
  onEditSet,
  onRepCountChange,
  onWeightChange,
  onDurationSecChange,
  onSubmitSet,
  onCancelAdd,
}: ExerciseItemProps) {
  // Use fresh tracking type from exercises list when in add-set mode (workout detail cache may be stale)
  const trackingType = (isAddingSet && addingTrackingType) ? addingTrackingType : exercise.tracking_type

  // Progress summary calculations
  const progressSummary = (() => {
    if (trackingType === 'reps_weight') {
      const volume = exercise.sets.reduce(
        (total, set) => total + (set.rep_count ?? 0) * (set.weight ?? 0),
        0,
      )
      return (
        <div className="mt-3 flex flex-col border-t pt-2">
          <span className="text-xs font-medium uppercase tracking-widest text-gray-400">Volume</span>
          <span className="text-lg font-bold text-gray-900">
            {volume}
            <span className="ml-1 text-sm font-normal text-gray-500">kg</span>
          </span>
        </div>
      )
    }

    if (trackingType === 'bodyweight') {
      const totalReps = exercise.sets.reduce((total, set) => total + (set.rep_count ?? 0), 0)
      const addedVolume = exercise.sets.reduce(
        (total, set) => total + (set.rep_count ?? 0) * (set.weight ?? 0),
        0,
      )
      return (
        <div className="mt-3 flex flex-col border-t pt-2">
          <span className="text-xs font-medium uppercase tracking-widest text-gray-400">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {totalReps}
            <span className="ml-1 text-sm font-normal text-gray-500">reps total</span>
          </span>
          {addedVolume > 0 && (
            <span className="text-sm text-gray-500">
              +{addedVolume} kg added volume
            </span>
          )}
        </div>
      )
    }

    // duration
    const totalSec = exercise.sets.reduce((total, set) => total + (set.duration_sec ?? 0), 0)
    return (
      <div className="mt-3 flex flex-col border-t pt-2">
        <span className="text-xs font-medium uppercase tracking-widest text-gray-400">Duration</span>
        <span className="text-lg font-bold text-gray-900">
          {formatDuration(totalSec)}
        </span>
      </div>
    )
  })()

  // Add-set form inputs per tracking type
  const addSetInputs = (() => {
    if (trackingType === 'reps_weight') {
      return (
        <>
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
        </>
      )
    }

    if (trackingType === 'bodyweight') {
      return (
        <>
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
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-muted-foreground">Added weight (kg)</label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => onWeightChange(e.target.value)}
              placeholder="0"
              className="h-8"
            />
          </div>
        </>
      )
    }

    // duration
    return (
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs text-muted-foreground">Duration (sec)</label>
        <Input
          type="number"
          value={durationSec}
          onChange={(e) => onDurationSecChange(e.target.value)}
          placeholder="0"
          className="h-8"
        />
      </div>
    )
  })()

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
        {progressSummary}
      </div>

      {isAddingSet && (
        <div className="flex flex-col gap-2 border-t pt-2">
          <div className="flex gap-2 items-end">
            {addSetInputs}
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
