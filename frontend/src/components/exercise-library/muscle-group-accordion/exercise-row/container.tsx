import { useExerciseRow } from "./hooks"
import { ExerciseRowReadView, ExerciseRowEditView } from "./views"
import { DeleteDialog } from "@/components/ui/custom/delete-dialog"
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
