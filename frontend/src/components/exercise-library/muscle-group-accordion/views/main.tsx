import { Pencil, Trash2, Check, X, Plus } from "lucide-react"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExerciseRow } from "../exercise-row"
import type { MuscleGroupAccordionViewProps, DeleteMuscleGroupDialogProps } from "../types"

export function DeleteMuscleGroupDialog({
  muscleGroupName,
  open,
  onOpenChange,
  onConfirm,
}: DeleteMuscleGroupDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete muscle group?</AlertDialogTitle>
          <AlertDialogDescription>
            "{muscleGroupName}" and all its exercises will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function MuscleGroupAccordionView({
  muscleGroup,
  exercises,
  isEditing,
  editName,
  editVnName,
  isSaving,
  onEditStart,
  onEditNameChange,
  onEditVnNameChange,
  onSave,
  onCancel,
  onDeleteClick,
  isAddingExercise,
  newExerciseName,
  newExerciseVnName,
  isCreatingExercise,
  onAddExercise,
  onCancelAddExercise,
  onNewExerciseNameChange,
  onNewExerciseVnNameChange,
  onCreateExercise,
}: MuscleGroupAccordionViewProps) {
  return (
    <AccordionItem value={String(muscleGroup.id)} className="border rounded-lg px-2">
      <AccordionTrigger className="group/trigger hover:no-underline py-3">
        {isEditing ? (
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-2 pr-2">
            <Input
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              placeholder="Name (English)"
              className="flex-1 h-8 text-sm"
              disabled={isSaving}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <Input
              value={editVnName}
              onChange={(e) => onEditVnNameChange(e.target.value)}
              placeholder="Tên tiếng Việt"
              className="flex-1 h-8 text-sm"
              disabled={isSaving}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-1">
              <Button
                size="icon" variant="ghost" className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onSave() }}
                disabled={isSaving}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon" variant="ghost" className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onCancel() }}
                disabled={isSaving}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-2 min-w-0 pr-2">
            <span className="truncate font-medium">{muscleGroup.name}</span>
            <span className="truncate text-sm text-muted-foreground hidden sm:inline">
              · {muscleGroup.vn_name}
            </span>
            <div className="ml-auto flex gap-1 opacity-0 group-hover/trigger:opacity-100 transition-opacity">
              <Button
                size="icon" variant="ghost"
                className="h-8 w-8 min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
                onClick={(e) => { e.stopPropagation(); onEditStart() }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon" variant="ghost"
                className="h-8 w-8 min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDeleteClick() }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </AccordionTrigger>

      <AccordionContent>
        <div className="pb-2">
          {exercises.length === 0 && !isAddingExercise && (
            <p className="text-sm text-muted-foreground px-3 py-2">No exercises yet.</p>
          )}
          {exercises.map((ex) => (
            <ExerciseRow key={ex.id} exercise={ex} />
          ))}
          {isAddingExercise && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 py-2 px-3 border-t mt-1">
              <Input
                placeholder="Exercise name (English)"
                className="flex-1 h-8 text-sm"
                value={newExerciseName}
                onChange={(e) => onNewExerciseNameChange(e.target.value)}
                disabled={isCreatingExercise}
                autoFocus
              />
              <Input
                placeholder="Tên bài tập (tiếng Việt)"
                className="flex-1 h-8 text-sm"
                value={newExerciseVnName}
                onChange={(e) => onNewExerciseVnNameChange(e.target.value)}
                disabled={isCreatingExercise}
              />
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCreateExercise} disabled={isCreatingExercise}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancelAddExercise} disabled={isCreatingExercise}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          {!isAddingExercise && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-8 text-muted-foreground w-full sm:w-auto"
              onClick={onAddExercise}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Exercise
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
