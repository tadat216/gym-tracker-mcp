import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ExerciseRowEditViewProps } from "../types"

export function ExerciseRowEditView({
  name,
  vnName,
  isSaving,
  onNameChange,
  onVnNameChange,
  onSave,
  onCancel,
}: ExerciseRowEditViewProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 px-3">
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Name (English)"
        className="flex-1 h-8 text-sm"
        disabled={isSaving}
        autoFocus
      />
      <Input
        value={vnName}
        onChange={(e) => onVnNameChange(e.target.value)}
        placeholder="Tên tiếng Việt"
        className="flex-1 h-8 text-sm"
        disabled={isSaving}
      />
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onSave} disabled={isSaving}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancel} disabled={isSaving}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
