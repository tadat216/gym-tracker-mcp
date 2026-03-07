import { useExerciseRow } from "./hooks"
import { ExerciseRowReadView, ExerciseRowEditView, ExerciseRowDeleteDialog } from "./views"
import type { Exercise } from "../../types"

interface ExerciseRowProps {
  exercise: Exercise
}

export function ExerciseRow({ exercise }: ExerciseRowProps) {
  const {
    isEditing,
    showDeleteConfirm,
    name,
    vnName,
    setIsEditing,
    setShowDeleteConfirm,
    onNameChange,
    onVnNameChange,
    handleSave,
    handleCancel,
    handleDelete,
    isSaving,
  } = useExerciseRow(exercise)

  return (
    <>
      {isEditing ? (
        <ExerciseRowEditView
          name={name}
          vnName={vnName}
          isSaving={isSaving}
          onNameChange={onNameChange}
          onVnNameChange={onVnNameChange}
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
      <ExerciseRowDeleteDialog
        exerciseName={exercise.name}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
      />
    </>
  )
}
