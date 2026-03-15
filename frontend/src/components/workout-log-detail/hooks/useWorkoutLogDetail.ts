import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useListWorkoutsInRangeApiWorkoutsRangeGet,
  useGetWorkoutDetailApiWorkoutsWorkoutIdGet,
  useCreateWorkoutApiWorkoutsPost,
  getGetWorkoutDetailApiWorkoutsWorkoutIdGetQueryKey,
  getListWorkoutsInRangeApiWorkoutsRangeGetQueryKey,
} from '../../../api/workouts/workouts'
import {
  useAddExerciseToWorkoutApiWorkoutExercisesPost,
  useRemoveExerciseFromWorkoutApiWorkoutExercisesWorkoutExerciseIdDelete,
} from '../../../api/workout-exercises/workout-exercises'
import { useLogSetApiSetsPost, useDeleteSetApiSetsSetIdDelete, useUpdateSetApiSetsSetIdPatch } from '../../../api/sets/sets'
import { useListMuscleGroupsApiMuscleGroupsGet } from '../../../api/muscle-groups/muscle-groups'
import { useListExercisesApiExercisesGet } from '../../../api/exercises/exercises'
import type { Exercise, MuscleGroup, WorkoutDetail } from '../types'

export function useWorkoutLogDetail(date: string) {
  const [workoutId, setWorkoutId] = useState<number | null>(null)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  // When adding a set to an existing exercise, store its workout_exercise_id to skip re-creating it
  const [selectedWorkoutExerciseId, setSelectedWorkoutExerciseId] = useState<number | null>(null)
  const [repCount, setRepCount] = useState('')
  const [weight, setWeight] = useState('')
  const [durationSec, setDurationSec] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()

  const { data: workoutsInRange, isLoading: isLoadingRange } =
    useListWorkoutsInRangeApiWorkoutsRangeGet({ start_date: date, end_date: date })

  // Sync workoutId from range query result
  const rangeList = workoutsInRange as Array<{ id: number }> | undefined
  const resolvedWorkoutId = workoutId ?? rangeList?.[0]?.id ?? null

  useEffect(() => {
    if (rangeList && rangeList.length > 0 && workoutId === null) {
      setWorkoutId(rangeList[0].id)
    }
  }, [rangeList, workoutId])

  const { data: workoutData, isLoading: isLoadingDetail } =
    useGetWorkoutDetailApiWorkoutsWorkoutIdGet(resolvedWorkoutId!, {
      query: {
        enabled: resolvedWorkoutId !== null,
      },
    })

  const { data: muscleGroupsData } = useListMuscleGroupsApiMuscleGroupsGet()
  const { data: exercisesData } = useListExercisesApiExercisesGet()

  const createWorkoutMutation = useCreateWorkoutApiWorkoutsPost()
  const addExerciseMutation = useAddExerciseToWorkoutApiWorkoutExercisesPost()
  const logSetMutation = useLogSetApiSetsPost()
  const deleteSetMutation = useDeleteSetApiSetsSetIdDelete()
  const updateSetMutation = useUpdateSetApiSetsSetIdPatch()
  const removeExerciseMutation =
    useRemoveExerciseFromWorkoutApiWorkoutExercisesWorkoutExerciseIdDelete()

  const muscleGroups = (muscleGroupsData as MuscleGroup[] | undefined) ?? []
  const exercises = (exercisesData as Exercise[] | undefined) ?? []
  const workout = workoutData as WorkoutDetail | undefined
  const isLoading = isLoadingRange || (resolvedWorkoutId !== null && isLoadingDetail)

  async function handleSubmitSet() {
    if (!selectedExercise) return
    setIsSubmitting(true)
    try {
      let currentWorkoutId = resolvedWorkoutId

      if (currentWorkoutId === null) {
        const result = await createWorkoutMutation.mutateAsync({ data: { date } })
        const newWorkoutId = (result as { id: number }).id
        setWorkoutId(newWorkoutId)
        currentWorkoutId = newWorkoutId
      }

      // Reuse existing workout_exercise_id when adding to an existing exercise
      let workoutExerciseId = selectedWorkoutExerciseId
      if (workoutExerciseId === null) {
        const weResult = await addExerciseMutation.mutateAsync({
          data: { workout_id: currentWorkoutId!, exercise_id: selectedExercise.id },
        })
        workoutExerciseId = (weResult as { id: number }).id
      }

      const trackingType = selectedExercise.tracking_type
      let setPayload: { workout_exercise_id: number; rep_count?: number; weight?: number; duration_sec?: number }
      if (trackingType === 'reps_weight') {
        setPayload = { workout_exercise_id: workoutExerciseId, rep_count: Number(repCount), weight: Number(weight) }
      } else if (trackingType === 'bodyweight') {
        setPayload = { workout_exercise_id: workoutExerciseId, rep_count: Number(repCount) }
        if (weight && Number(weight) > 0) {
          setPayload.weight = Number(weight)
        }
      } else { // duration
        setPayload = { workout_exercise_id: workoutExerciseId, duration_sec: Number(durationSec) }
      }

      await logSetMutation.mutateAsync({ data: setPayload })

      await queryClient.invalidateQueries({
        queryKey: getGetWorkoutDetailApiWorkoutsWorkoutIdGetQueryKey(currentWorkoutId!),
      })
      await queryClient.invalidateQueries({
        queryKey: getListWorkoutsInRangeApiWorkoutsRangeGetQueryKey({
          start_date: date,
          end_date: date,
        }),
      })

      setSelectedExercise(null)
      setSelectedWorkoutExerciseId(null)
      setRepCount('')
      setWeight('')
      setDurationSec('')
      setShowAddExercise(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteSet(setId: number, workoutExerciseId: number, isLastSet: boolean) {
    await deleteSetMutation.mutateAsync({ setId })
    if (isLastSet) {
      await removeExerciseMutation.mutateAsync({ workoutExerciseId })
    }
    if (resolvedWorkoutId !== null) {
      await queryClient.invalidateQueries({
        queryKey: getGetWorkoutDetailApiWorkoutsWorkoutIdGetQueryKey(resolvedWorkoutId!),
      })
    }
  }

  async function handleUpdateSet(setId: number, repCount: number, weight: number, duration_sec?: number) {
    await updateSetMutation.mutateAsync({ setId, data: { rep_count: repCount, weight, duration_sec } })
    if (resolvedWorkoutId !== null) {
      await queryClient.invalidateQueries({
        queryKey: getGetWorkoutDetailApiWorkoutsWorkoutIdGetQueryKey(resolvedWorkoutId),
      })
    }
  }

  // Called from "+ Add Set" on an existing exercise — reuses the existing workout_exercise
  function handleAddSet(exerciseId: number, workoutExerciseId: number) {
    const exercise = exercises.find((e) => e.id === exerciseId)
    if (exercise) {
      setSelectedExercise(exercise)
      setSelectedWorkoutExerciseId(workoutExerciseId)
      setShowAddExercise(true)
    }
  }

  function handleCancelAdd() {
    setShowAddExercise(false)
    setSelectedExercise(null)
    setSelectedWorkoutExerciseId(null)
  }

  return {
    workout,
    isLoading,
    muscleGroups,
    exercises,
    showAddExercise,
    setShowAddExercise,
    selectedExercise,
    setSelectedExercise,
    repCount,
    setRepCount,
    weight,
    setWeight,
    durationSec,
    onDurationSecChange: (value: string) => setDurationSec(value),
    handleSubmitSet,
    handleDeleteSet,
    handleUpdateSet,
    handleAddSet,
    handleCancelAdd,
    isSubmitting,
    selectedWorkoutExerciseId,
  }
}
