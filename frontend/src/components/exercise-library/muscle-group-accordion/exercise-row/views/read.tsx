import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ExerciseRowReadViewProps } from "../types"

export function ExerciseRowReadView({ exercise, onEdit, onDelete }: ExerciseRowReadViewProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 px-3 rounded-md hover:bg-muted/50 group">
      <span className="flex-1 text-sm font-medium">{exercise.name}</span>
      <span className="flex-1 text-sm text-muted-foreground">{exercise.vn_name}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
