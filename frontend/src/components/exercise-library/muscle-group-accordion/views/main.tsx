import { Pencil, Trash2, Check, X, Plus } from "lucide-react"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExerciseRow } from "../exercise-row"
import type { MuscleGroupAccordionViewProps } from "../types"

export function MuscleGroupAccordionView({
  muscleGroup,
  exercises,
  allMuscleGroups,
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
  newExerciseTrackingType,
  isCreatingExercise,
  onAddExercise,
  onCancelAddExercise,
  onNewExerciseNameChange,
  onNewExerciseVnNameChange,
  onNewExerciseTrackingTypeChange,
  onCreateExercise,
}: MuscleGroupAccordionViewProps) {
  return (
    <AccordionItem value={String(muscleGroup.id)} className="border rounded-lg px-2">
      <AccordionTrigger className="group/trigger hover:no-underline">
        {isEditing ? (
          <div className="form-row flex-1 items-start">
            <Input
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              placeholder="Name (English)"
              className="flex-1"
              disabled={isSaving}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <Input
              value={editVnName}
              onChange={(e) => onEditVnNameChange(e.target.value)}
              placeholder="Tên tiếng Việt"
              className="flex-1"
              disabled={isSaving}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="action-group">
              <Button
                size="icon" variant="ghost"
                onClick={(e) => { e.stopPropagation(); onSave() }}
                disabled={isSaving}
              >
                <Check />
              </Button>
              <Button
                size="icon" variant="ghost"
                onClick={(e) => { e.stopPropagation(); onCancel() }}
                disabled={isSaving}
              >
                <X />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <h2 className="truncate text-lg font-bold">{muscleGroup.name}</h2>
            <span className="truncate text-muted-foreground sm:inline">
              {muscleGroup.vn_name}
            </span>
            <div className="ml-auto action-group sm:opacity-0 sm:group-hover/trigger:opacity-100 transition-opacity">
              <Button
                size="icon" variant="ghost"
                onClick={(e) => { e.stopPropagation(); onEditStart() }}
              >
                <Pencil />
              </Button>
              <Button
                size="icon" variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDeleteClick() }}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        )}
      </AccordionTrigger>

      <AccordionContent>
        <div className="flex flex-col gap-1.5 pt-1">
          {exercises.length === 0 && !isAddingExercise && (
            <p className="text-muted-foreground text-sm">No exercises yet.</p>
          )}
          {exercises.map((ex) => (
            <ExerciseRow key={ex.id} exercise={ex} allMuscleGroups={allMuscleGroups} />
          ))}
          {isAddingExercise && (
            <div className="form-row items-start border rounded-md px-3 py-2">
              <Input
                placeholder="Exercise name (English)"
                className="flex-1"
                value={newExerciseName}
                onChange={(e) => onNewExerciseNameChange(e.target.value)}
                disabled={isCreatingExercise}
                autoFocus
              />
              <Input
                placeholder="Tên bài tập (tiếng Việt)"
                className="flex-1"
                value={newExerciseVnName}
                onChange={(e) => onNewExerciseVnNameChange(e.target.value)}
                disabled={isCreatingExercise}
              />
              <Select
                value={newExerciseTrackingType}
                onValueChange={(value) => value !== null && onNewExerciseTrackingTypeChange(value)}
                disabled={isCreatingExercise}
                aria-label="Tracking type"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tracking type">
                    {{ reps_weight: 'Weighted', bodyweight: 'Bodyweight', duration: 'Duration' }[newExerciseTrackingType] ?? 'Select tracking type'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="reps_weight">Weighted</SelectItem>
                    <SelectItem value="bodyweight">Bodyweight</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div className="action-group">
                <Button size="icon" variant="ghost" onClick={onCreateExercise} disabled={isCreatingExercise}>
                  <Check />
                </Button>
                <Button size="icon" variant="ghost" onClick={onCancelAddExercise} disabled={isCreatingExercise}>
                  <X />
                </Button>
              </div>
            </div>
          )}
          {!isAddingExercise && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground w-full sm:w-auto"
              onClick={onAddExercise}
            >
              <Plus />
              Add Exercise
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
