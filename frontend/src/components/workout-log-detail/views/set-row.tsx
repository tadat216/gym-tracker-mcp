import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { SetData } from '../types'

interface SetRowProps {
  set: SetData
  index: number
  onDelete: () => void
  onEdit: (setId: number, repCount: number, weight: number) => Promise<void>
}

export function SetRow({ set, index, onDelete, onEdit }: SetRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editWeight, setEditWeight] = useState(String(set.weight))
  const [editRepCount, setEditRepCount] = useState(String(set.rep_count))
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      await onEdit(set.id, Number(editRepCount), Number(editWeight))
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setEditWeight(String(set.weight))
    setEditRepCount(String(set.rep_count))
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-muted-foreground text-sm w-12">Set {index + 1}</span>
        <div className="flex flex-col gap-0.5 flex-1">
          <label className="text-xs text-muted-foreground">Weight (kg)</label>
          <Input
            type="number"
            value={editWeight}
            onChange={(e) => setEditWeight(e.target.value)}
            className="h-7 text-sm"
          />
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          <label className="text-xs text-muted-foreground">Reps</label>
          <Input
            type="number"
            value={editRepCount}
            onChange={(e) => setEditRepCount(e.target.value)}
            className="h-7 text-sm"
          />
        </div>
        <div className="flex gap-1 items-end pb-0.5">
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-xs">
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving} className="h-7 text-xs">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 py-1 text-sm">
      <span className="text-muted-foreground w-12">Set {index + 1}</span>
      <span className="w-16">{set.weight}kg</span>
      <span className="w-16">{set.rep_count} reps</span>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="text-muted-foreground hover:text-foreground min-w-8 min-h-8 flex items-center justify-center text-xs"
        aria-label="Edit set"
      >
        ✎
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="text-destructive hover:text-destructive/80 min-w-8 min-h-8 flex items-center justify-center"
        aria-label="Delete set"
      >
        ×
      </button>
    </div>
  )
}
