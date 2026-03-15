import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Exercise, MuscleGroup } from '../types'

interface AddExerciseFormProps {
  muscleGroups: MuscleGroup[]
  exercises: Exercise[]
  existingExerciseIds: Set<number>
  selectedExercise: Exercise | null
  repCount: string
  weight: string
  durationSec: string
  isSubmitting: boolean
  onSelectExercise: (exercise: Exercise) => void
  onRepCountChange: (v: string) => void
  onWeightChange: (v: string) => void
  onDurationSecChange: (v: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export function AddExerciseForm({
  muscleGroups,
  exercises,
  existingExerciseIds,
  selectedExercise,
  repCount,
  weight,
  durationSec,
  isSubmitting,
  onSelectExercise,
  onRepCountChange,
  onWeightChange,
  onDurationSecChange,
  onSubmit,
  onCancel,
}: AddExerciseFormProps) {
  if (selectedExercise === null) {
    return (
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Select an exercise</p>
        <Accordion className="w-full">
          {muscleGroups.map((mg) => {
            const groupExercises = exercises.filter(
              (e) => e.muscle_group_id === mg.id && !existingExerciseIds.has(e.id)
            )
            if (groupExercises.length === 0) return null
            return (
              <AccordionItem key={mg.id} value={String(mg.id)}>
                <AccordionTrigger>{mg.name}</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-1">
                    {groupExercises.map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => onSelectExercise(ex)}
                        className="rounded px-2 py-1 text-left text-sm hover:bg-accent"
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">
        Adding set for: <span className="text-foreground">{selectedExercise.name}</span>
      </p>
      <div className="flex gap-2 items-end">
        {selectedExercise.tracking_type === 'duration' ? (
          <div className="flex flex-col gap-1 flex-1">
            <Label htmlFor="duration-input" className="text-xs text-muted-foreground">Duration (sec)</Label>
            <Input
              id="duration-input"
              type="number"
              value={durationSec}
              onChange={(e) => onDurationSecChange(e.target.value)}
              placeholder="0"
              className="h-8"
            />
          </div>
        ) : (
          <>
            {selectedExercise.tracking_type === 'bodyweight' ? (
              <div className="flex flex-col gap-1 flex-1">
                <Label htmlFor="reps-input" className="text-xs text-muted-foreground">Reps</Label>
                <Input
                  id="reps-input"
                  type="number"
                  value={repCount}
                  onChange={(e) => onRepCountChange(e.target.value)}
                  placeholder="0"
                  className="h-8"
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1 flex-1">
                  <Label htmlFor="weight-input" className="text-xs text-muted-foreground">Weight (kg)</Label>
                  <Input
                    id="weight-input"
                    type="number"
                    value={weight}
                    onChange={(e) => onWeightChange(e.target.value)}
                    placeholder="0"
                    className="h-8"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <Label htmlFor="reps-input" className="text-xs text-muted-foreground">Reps</Label>
                  <Input
                    id="reps-input"
                    type="number"
                    value={repCount}
                    onChange={(e) => onRepCountChange(e.target.value)}
                    placeholder="0"
                    className="h-8"
                  />
                </div>
              </>
            )}
          </>
        )}
        <Button type="button" size="sm" onClick={onSubmit} disabled={isSubmitting} className="h-8">
          Add
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting} className="h-8">
          Cancel
        </Button>
      </div>
    </div>
  )
}
