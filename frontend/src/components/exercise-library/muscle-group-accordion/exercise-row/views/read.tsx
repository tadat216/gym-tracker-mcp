import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ExerciseRowReadViewProps } from "../types"

export function ExerciseRowReadView({ exercise, onEdit, onDelete }: ExerciseRowReadViewProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-1.5 group/row hover:bg-muted/40 transition-colors">
      <span className="flex-1 font-medium text-sm">{exercise.name}</span>
      <span className="flex-1 text-sm text-muted-foreground">{exercise.vn_name}</span>
      <div className="action-group shrink-0">
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
