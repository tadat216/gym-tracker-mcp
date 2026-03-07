import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useUpdateMuscleGroupApiMuscleGroupsMuscleGroupIdPatch,
  getListMuscleGroupsApiMuscleGroupsGetQueryKey,
} from "@/api/muscle-groups/muscle-groups"
import {
  useCreateExerciseApiExercisesPost,
  getListExercisesApiExercisesGetQueryKey,
} from "@/api/exercises/exercises"
import type { MuscleGroup } from "../types"

export function useMuscleGroupAccordion(muscleGroup: MuscleGroup) {
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(muscleGroup.name)
  const [editVnName, setEditVnName] = useState(muscleGroup.vn_name)

  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState("")
  const [newExerciseVnName, setNewExerciseVnName] = useState("")

  const invalidateGroups = () =>
    queryClient.invalidateQueries({ queryKey: getListMuscleGroupsApiMuscleGroupsGetQueryKey() })
  const invalidateExercises = () =>
    queryClient.invalidateQueries({ queryKey: getListExercisesApiExercisesGetQueryKey() })

  const updateMutation = useUpdateMuscleGroupApiMuscleGroupsMuscleGroupIdPatch({
    mutation: {
      onSuccess: () => {
        invalidateGroups()
        setIsEditing(false)
      },
    },
  })

  const createExerciseMutation = useCreateExerciseApiExercisesPost({
    mutation: {
      onSuccess: () => {
        invalidateExercises()
        setIsAddingExercise(false)
        setNewExerciseName("")
        setNewExerciseVnName("")
      },
    },
  })

  const handleSave = () => {
    if (!editName.trim()) return
    updateMutation.mutate({
      muscleGroupId: muscleGroup.id,
      data: { name: editName.trim(), vn_name: editVnName.trim() },
    })
  }

  const handleCancel = () => {
    setEditName(muscleGroup.name)
    setEditVnName(muscleGroup.vn_name)
    setIsEditing(false)
  }

  const handleCreateExercise = () => {
    if (!newExerciseName.trim()) return
    createExerciseMutation.mutate({
      data: {
        name: newExerciseName.trim(),
        vn_name: newExerciseVnName.trim(),
        muscle_group_id: muscleGroup.id,
      },
    })
  }

  return {
    isEditing,
    editName,
    editVnName,
    isAddingExercise,
    newExerciseName,
    newExerciseVnName,
    setIsEditing,
    setIsAddingExercise,
    onEditNameChange: setEditName,
    onEditVnNameChange: setEditVnName,
    onNewExerciseNameChange: setNewExerciseName,
    onNewExerciseVnNameChange: setNewExerciseVnName,
    handleSave,
    handleCancel,
    handleCreateExercise,
    isSaving: updateMutation.isPending,
    isCreatingExercise: createExerciseMutation.isPending,
  }
}
