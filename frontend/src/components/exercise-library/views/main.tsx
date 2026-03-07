import { Plus, Check, X } from "lucide-react"
import { Accordion } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MuscleGroupAccordion } from "../muscle-group-accordion"
import type { ExerciseLibraryViewProps } from "../types"

export function ExerciseLibraryView({
  muscleGroups,
  exercises,
  isAdding,
  isCreating,
  newName,
  newVnName,
  onAdd,
  onCancelAdd,
  onCreate,
  onDelete,
  onNewNameChange,
  onNewVnNameChange,
}: ExerciseLibraryViewProps) {
  const exercisesForGroup = (groupId: number) =>
    exercises.filter((e) => e.muscle_group_id === groupId)

  return (
    <div className="space-y-3">
      <Accordion multiple className="space-y-2">
        {muscleGroups.map((group) => (
          <MuscleGroupAccordion
            key={group.id}
            muscleGroup={group}
            exercises={exercisesForGroup(group.id)}
            onDelete={onDelete}
          />
        ))}
      </Accordion>

      {isAdding ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 border rounded-lg">
          <Input
            placeholder="Muscle group name (English)"
            className="flex-1"
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
            disabled={isCreating}
            autoFocus
          />
          <Input
            placeholder="Tên nhóm cơ (tiếng Việt)"
            className="flex-1"
            value={newVnName}
            onChange={(e) => onNewVnNameChange(e.target.value)}
            disabled={isCreating}
          />
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={onCreate} disabled={isCreating}>
              <Check />
            </Button>
            <Button size="icon" variant="ghost" onClick={onCancelAdd} disabled={isCreating}>
              <X />
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full sm:w-auto" onClick={onAdd}>
          <Plus />
          Add Muscle Group
        </Button>
      )}
    </div>
  )
}
