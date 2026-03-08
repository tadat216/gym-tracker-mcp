import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ExerciseRowReadViewProps } from "../types"

export function ExerciseRowReadView({ exercise, onEdit, onDelete }: ExerciseRowReadViewProps) {
  return (
    <div className="data-row group">
      <span className="flex-1 font-medium">{exercise.name}</span>
      <span className="flex-1 text-muted-foreground">{exercise.vn_name}</span>
      <div className="action-group hover-reveal">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}
