import { useState } from "react"
import { useMuscleGroupAccordion } from "./hooks"
import { MuscleGroupAccordionView, DeleteMuscleGroupDialog } from "./views"
import type { MuscleGroup, Exercise } from "../types"

interface MuscleGroupAccordionProps {
  muscleGroup: MuscleGroup
  exercises: Exercise[]
  onDelete: (id: number) => void
}

export function MuscleGroupAccordion({
  muscleGroup,
  exercises,
  onDelete,
}: MuscleGroupAccordionProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const hook = useMuscleGroupAccordion(muscleGroup)

  return (
    <>
      <MuscleGroupAccordionView
        muscleGroup={muscleGroup}
        exercises={exercises}
        isEditing={hook.isEditing}
        editName={hook.editName}
        editVnName={hook.editVnName}
        isSaving={hook.isSaving}
        onEditStart={() => hook.setIsEditing(true)}
        onEditNameChange={hook.onEditNameChange}
        onEditVnNameChange={hook.onEditVnNameChange}
        onSave={hook.handleSave}
        onCancel={hook.handleCancel}
        onDeleteClick={() => setShowDeleteConfirm(true)}
        isAddingExercise={hook.isAddingExercise}
        newExerciseName={hook.newExerciseName}
        newExerciseVnName={hook.newExerciseVnName}
        isCreatingExercise={hook.isCreatingExercise}
        onAddExercise={() => hook.setIsAddingExercise(true)}
        onCancelAddExercise={() => hook.setIsAddingExercise(false)}
        onNewExerciseNameChange={hook.onNewExerciseNameChange}
        onNewExerciseVnNameChange={hook.onNewExerciseVnNameChange}
        onCreateExercise={hook.handleCreateExercise}
      />
      <DeleteMuscleGroupDialog
        muscleGroupName={muscleGroup.name}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => { onDelete(muscleGroup.id); setShowDeleteConfirm(false) }}
      />
    </>
  )
}
