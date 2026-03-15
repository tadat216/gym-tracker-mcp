import { useState } from "react"
import { useMuscleGroupAccordion } from "./hooks"
import { MuscleGroupAccordionView } from "./views"
import { DeleteDialog } from "@/components/ui/custom/delete-dialog"
import type { MuscleGroup, Exercise } from "../types"

interface MuscleGroupAccordionProps {
  muscleGroup: MuscleGroup
  exercises: Exercise[]
  allMuscleGroups: MuscleGroup[]
  onDelete: (id: number) => void
}

export function MuscleGroupAccordion({
  muscleGroup,
  exercises,
  allMuscleGroups,
  onDelete,
}: MuscleGroupAccordionProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const hook = useMuscleGroupAccordion(muscleGroup)

  return (
    <>
      <MuscleGroupAccordionView
        muscleGroup={muscleGroup}
        exercises={exercises}
        allMuscleGroups={allMuscleGroups}
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
        newExerciseTrackingType={hook.newExerciseTrackingType}
        isCreatingExercise={hook.isCreatingExercise}
        onAddExercise={() => hook.setIsAddingExercise(true)}
        onCancelAddExercise={() => hook.setIsAddingExercise(false)}
        onNewExerciseNameChange={hook.onNewExerciseNameChange}
        onNewExerciseVnNameChange={hook.onNewExerciseVnNameChange}
        onNewExerciseTrackingTypeChange={hook.onNewExerciseTrackingTypeChange}
        onCreateExercise={hook.handleCreateExercise}
      />
      <DeleteDialog
        title="Delete muscle group?"
        description={`"${muscleGroup.name}" and all its exercises will be permanently deleted.`}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => { onDelete(muscleGroup.id); setShowDeleteConfirm(false) }}
      />
    </>
  )
}
