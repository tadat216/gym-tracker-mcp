import type { Exercise, ExerciseData, MuscleGroup, WorkoutDetail } from '../types'
import { ExerciseItem } from './exercise-item'
import { AddExerciseForm } from './add-exercise-form'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface WorkoutLogDetailViewProps {
  date: string
  workout: WorkoutDetail | undefined
  isLoading: boolean
  muscleGroups: MuscleGroup[]
  exercises: Exercise[]
  showAddExercise: boolean
  selectedExercise: Exercise | null
  selectedWorkoutExerciseId: number | null
  repCount: string
  weight: string
  durationSec: string
  isSubmitting: boolean
  onAddExercise: () => void
  onSelectExercise: (exercise: Exercise) => void
  onRepCountChange: (v: string) => void
  onWeightChange: (v: string) => void
  onDurationSecChange: (v: string) => void
  onSubmitSet: () => void
  onCancelAdd: () => void
  onAddSet: (exerciseId: number, workoutExerciseId: number) => void
  onDeleteSet: (setId: number, workoutExerciseId: number, isLastSet: boolean) => void
  onEditSet: (setId: number, payload: { rep_count?: number; weight?: number; duration_sec?: number }) => Promise<void>
  onBack: () => void
}

export function WorkoutLogDetailView({
  date,
  workout,
  isLoading,
  muscleGroups,
  exercises,
  showAddExercise,
  selectedExercise,
  selectedWorkoutExerciseId,
  repCount,
  weight,
  durationSec,
  isSubmitting,
  onAddExercise,
  onSelectExercise,
  onRepCountChange,
  onWeightChange,
  onDurationSecChange,
  onSubmitSet,
  onCancelAdd,
  onAddSet,
  onDeleteSet,
  onEditSet,
  onBack,
}: WorkoutLogDetailViewProps) {
  // "add set to existing exercise" mode — form is inline inside the exercise card
  const isAddingToExisting = showAddExercise && selectedWorkoutExerciseId !== null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">{formatDate(date)}</h1>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {workout?.exercises.map((ex: ExerciseData) => (
              <ExerciseItem
                key={ex.workout_exercise_id}
                exercise={ex}
                isAddingSet={isAddingToExisting && selectedExercise?.id === ex.exercise_id}
                repCount={repCount}
                weight={weight}
                durationSec={durationSec}
                isSubmitting={isSubmitting}
                onAddSet={onAddSet}
                onDeleteSet={onDeleteSet}
                onEditSet={onEditSet}
                onRepCountChange={onRepCountChange}
                onWeightChange={onWeightChange}
                onDurationSecChange={onDurationSecChange}
                onSubmitSet={onSubmitSet}
                onCancelAdd={onCancelAdd}
              />
            ))}
            {workout?.exercises.length === 0 && !showAddExercise && (
              <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-muted/20 border-dashed">
                <p className="text-muted-foreground">No exercises logged for this workout yet.</p>
              </div>
            )}
          </div>

          {!showAddExercise && (
            <button
              type="button"
              onClick={onAddExercise}
              className="text-sm text-primary hover:underline self-start"
            >
              + Add Exercise
            </button>
          )}

          {showAddExercise && !isAddingToExisting && (
            <AddExerciseForm
              muscleGroups={muscleGroups}
              exercises={exercises}
              existingExerciseIds={new Set(workout?.exercises.map((e) => e.exercise_id) ?? [])}
              selectedExercise={selectedExercise}
              repCount={repCount}
              weight={weight}
              isSubmitting={isSubmitting}
              onSelectExercise={onSelectExercise}
              onRepCountChange={onRepCountChange}
              onWeightChange={onWeightChange}
              onSubmit={onSubmitSet}
              onCancel={onCancelAdd}
            />
          )}
        </>
      )}
    </div>
  )
}
