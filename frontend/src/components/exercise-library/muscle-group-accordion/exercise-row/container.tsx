import { useExerciseRow } from "./hooks"
import { ExerciseRowReadView, ExerciseRowEditView } from "./views"
import { DeleteDialog } from "@/components/ui/custom/delete-dialog"
import type { Exercise, MuscleGroup } from "../../types"

interface ExerciseRowProps {
  exercise: Exercise
  allMuscleGroups: MuscleGroup[]
}

export function ExerciseRow({ exercise, allMuscleGroups }: ExerciseRowProps) {
  const {
    isEditing,
    showDeleteConfirm,
    name,
    vnName,
    muscleGroupId,
    setIsEditing,
    setShowDeleteConfirm,
    onNameChange,
    onVnNameChange,
    onMuscleGroupChange,
    handleSave,
    handleCancel,
    handleDelete,
    isSaving,
  } = useExerciseRow(exercise)

  const muscleGroupName = allMuscleGroups.find((g) => g.id === muscleGroupId)?.name ?? ""

  const handleMuscleGroupChangeByName = (selectedName: string | null) => {
    if (!selectedName) return
    const group = allMuscleGroups.find((g) => g.name === selectedName)
    if (group) onMuscleGroupChange(group.id)
  }

  return (
    <>
      {isEditing ? (
        <ExerciseRowEditView
          name={name}
          vnName={vnName}
          muscleGroupName={muscleGroupName}
          allMuscleGroups={allMuscleGroups}
          isSaving={isSaving}
          onNameChange={onNameChange}
          onVnNameChange={onVnNameChange}
          onMuscleGroupChange={handleMuscleGroupChangeByName}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <ExerciseRowReadView
          exercise={exercise}
          onEdit={() => setIsEditing(true)}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      )}
      <DeleteDialog
        title="Delete exercise?"
        description={`"${exercise.name}" will be permanently deleted.`}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
      />
    </>
  )
}
