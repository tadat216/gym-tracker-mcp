import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ExerciseRowReadViewProps } from "../types"

export function ExerciseRowReadView({ exercise, onEdit, onDelete }: ExerciseRowReadViewProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 rounded-md hover:bg-muted/50 group">
      <span className="flex-1 font-medium">{exercise.name}</span>
      <span className="flex-1 text-muted-foreground">{exercise.vn_name}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
