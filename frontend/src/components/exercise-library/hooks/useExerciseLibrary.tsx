import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useListMuscleGroupsApiMuscleGroupsGet,
  getListMuscleGroupsApiMuscleGroupsGetQueryKey,
  useCreateMuscleGroupApiMuscleGroupsPost,
  useDeleteMuscleGroupApiMuscleGroupsMuscleGroupIdDelete,
} from "@/api/muscle-groups/muscle-groups"
import {
  useListExercisesApiExercisesGet,
  getListExercisesApiExercisesGetQueryKey,
} from "@/api/exercises/exercises"
import type { MuscleGroup, Exercise } from "../types"

export function useExerciseLibrary() {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newVnName, setNewVnName] = useState("")

  const { data: rawMuscleGroups, isLoading: loadingGroups } =
    useListMuscleGroupsApiMuscleGroupsGet()
  const { data: rawExercises, isLoading: loadingExercises } =
    useListExercisesApiExercisesGet()

  const muscleGroups = (rawMuscleGroups as MuscleGroup[] | undefined) ?? []
  const exercises = (rawExercises as Exercise[] | undefined) ?? []

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListMuscleGroupsApiMuscleGroupsGetQueryKey() })
    queryClient.invalidateQueries({ queryKey: getListExercisesApiExercisesGetQueryKey() })
  }

  const createMutation = useCreateMuscleGroupApiMuscleGroupsPost({
    mutation: {
      onSuccess: () => {
        invalidateAll()
        setIsAdding(false)
        setNewName("")
        setNewVnName("")
      },
    },
  })

  const deleteMutation = useDeleteMuscleGroupApiMuscleGroupsMuscleGroupIdDelete({
    mutation: { onSuccess: invalidateAll },
  })

  const handleCreate = () => {
    if (!newName.trim()) return
    createMutation.mutate({ data: { name: newName.trim(), vn_name: newVnName.trim() } })
  }

  const handleCancelAdd = () => {
    setIsAdding(false)
    setNewName("")
    setNewVnName("")
  }

  return {
    muscleGroups,
    exercises,
    isLoading: loadingGroups || loadingExercises,
    isAdding,
    newName,
    newVnName,
    setIsAdding,
    onNewNameChange: setNewName,
    onNewVnNameChange: setNewVnName,
    handleCreate,
    handleCancelAdd,
    handleDelete: (id: number) => deleteMutation.mutate({ muscleGroupId: id }),
    isCreating: createMutation.isPending,
  }
}
