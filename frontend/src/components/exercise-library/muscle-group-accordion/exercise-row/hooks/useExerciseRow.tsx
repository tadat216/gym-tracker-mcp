import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useUpdateExerciseApiExercisesExerciseIdPatch,
  useDeleteExerciseApiExercisesExerciseIdDelete,
  getListExercisesApiExercisesGetQueryKey,
} from "@/api/exercises/exercises"
import type { Exercise } from "../../types"

export function useExerciseRow(exercise: Exercise) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [name, setName] = useState(exercise.name)
  const [vnName, setVnName] = useState(exercise.vn_name)
  const [muscleGroupId, setMuscleGroupId] = useState(exercise.muscle_group_id)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListExercisesApiExercisesGetQueryKey() })

  const updateMutation = useUpdateExerciseApiExercisesExerciseIdPatch({
    mutation: {
      onSuccess: () => {
        invalidate()
        setIsEditing(false)
      },
    },
  })

  const deleteMutation = useDeleteExerciseApiExercisesExerciseIdDelete({
    mutation: { onSuccess: invalidate },
  })

  const handleSave = () => {
    if (!name.trim()) return
    updateMutation.mutate({
      exerciseId: exercise.id,
      data: { name: name.trim(), vn_name: vnName.trim(), muscle_group_id: muscleGroupId },
    })
  }

  const handleCancel = () => {
    setName(exercise.name)
    setVnName(exercise.vn_name)
    setMuscleGroupId(exercise.muscle_group_id)
    setIsEditing(false)
  }

  return {
    isEditing,
    showDeleteConfirm,
    name,
    vnName,
    muscleGroupId,
    setIsEditing,
    setShowDeleteConfirm,
    onNameChange: setName,
    onVnNameChange: setVnName,
    onMuscleGroupChange: setMuscleGroupId,
    handleSave,
    handleCancel,
    handleDelete: () => deleteMutation.mutate({ exerciseId: exercise.id }),
    isSaving: updateMutation.isPending,
  }
}
