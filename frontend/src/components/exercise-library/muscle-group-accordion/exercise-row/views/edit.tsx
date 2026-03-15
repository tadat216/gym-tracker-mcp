import { Check, X } from "lucide-react"
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
import type { ExerciseRowEditViewProps } from "../types"

export function ExerciseRowEditView({
  name,
  vnName,
  muscleGroupName,
  allMuscleGroups,
  trackingType,
  isSaving,
  onNameChange,
  onVnNameChange,
  onMuscleGroupChange,
  onTrackingTypeChange,
  onSave,
  onCancel,
}: ExerciseRowEditViewProps) {
  return (
    <div className="form-row flex-wrap">
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Name (English)"
        className="flex-1"
        disabled={isSaving}
        autoFocus
      />
      <Input
        value={vnName}
        onChange={(e) => onVnNameChange(e.target.value)}
        placeholder="Tên tiếng Việt"
        className="flex-1"
        disabled={isSaving}
      />
      <Select
        value={muscleGroupName}
        onValueChange={onMuscleGroupChange}
        disabled={isSaving}
        aria-label="Muscle group"
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select muscle group" />
        </SelectTrigger>
        <SelectContent>
           <SelectGroup>
            {allMuscleGroups.map((g) => (
              <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
            ))}
           </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={trackingType}
        onValueChange={onTrackingTypeChange}
        disabled={isSaving}
        aria-label="Tracking type"
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select tracking type" />
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
        <Button size="icon" variant="ghost" onClick={onSave} disabled={isSaving}>
          <Check />
        </Button>
        <Button size="icon" variant="ghost" onClick={onCancel} disabled={isSaving}>
          <X />
        </Button>
      </div>
    </div>
  )
}
