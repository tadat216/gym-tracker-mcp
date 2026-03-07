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
      data: { name: name.trim(), vn_name: vnName.trim() },
    })
  }

  const handleCancel = () => {
    setName(exercise.name)
    setVnName(exercise.vn_name)
    setIsEditing(false)
  }

  return {
    isEditing,
    showDeleteConfirm,
    name,
    vnName,
    setIsEditing,
    setShowDeleteConfirm,
    onNameChange: setName,
    onVnNameChange: setVnName,
    handleSave,
    handleCancel,
    handleDelete: () => deleteMutation.mutate({ exerciseId: exercise.id }),
    isSaving: updateMutation.isPending,
  }
}
