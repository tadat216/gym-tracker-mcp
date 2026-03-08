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
    <div className="form-row">
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
