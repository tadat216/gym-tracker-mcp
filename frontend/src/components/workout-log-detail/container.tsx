import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkoutLogDetail } from './hooks'
import { WorkoutLogDetailView } from './views'

export function WorkoutLogDetailContainer() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const hook = useWorkoutLogDetail(date!)

  useEffect(() => {
    if (!hook.isLoading && (!hook.workout || hook.workout.exercises.length === 0)) {
      hook.setShowAddExercise(true)
    }
  }, [hook.isLoading, hook.workout])

  return (
    <WorkoutLogDetailView
      date={date!}
      workout={hook.workout}
      isLoading={hook.isLoading}
      muscleGroups={hook.muscleGroups}
      exercises={hook.exercises}
      showAddExercise={hook.showAddExercise}
      selectedExercise={hook.selectedExercise}
      selectedWorkoutExerciseId={hook.selectedWorkoutExerciseId}
      repCount={hook.repCount}
      weight={hook.weight}
      isSubmitting={hook.isSubmitting}
      onAddExercise={() => hook.setShowAddExercise(true)}
      onSelectExercise={hook.setSelectedExercise}
      onRepCountChange={hook.setRepCount}
      onWeightChange={hook.setWeight}
      onSubmitSet={hook.handleSubmitSet}
      onCancelAdd={hook.handleCancelAdd}
      onAddSet={hook.handleAddSet}
      onDeleteSet={hook.handleDeleteSet}
      onEditSet={hook.handleUpdateSet}
      onBack={() => navigate(-1)}
    />
  )
}
