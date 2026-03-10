import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { SetData } from '../types'
import { Pencil, Trash } from 'lucide-react'

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
      <div className="flex items-end gap-2 py-1">
        <span className="text-muted-foreground text-sm w-12">Set {index + 1}</span>
        <div className="flex items-end gap-0.5 flex-1">
          <Input
            type="number"
            value={editWeight}
            onChange={(e) => setEditWeight(e.target.value)}
            className="h-7 text-sm"
          />
          <p className="text-sm text-muted-foreground">kg</p>
        </div>
        <div className="flex items-end gap-0.5 flex-1">
          <Input
            type="number"
            value={editRepCount}
            onChange={(e) => setEditRepCount(e.target.value)}
            className="h-7 text-sm"
          />
          <p className="text-sm text-muted-foreground">reps</p>
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
    <div className="grid grid-cols-8 items-center gap-4 py-1 text-sm">
      <span className="col-span-2  text-muted-foreground w-12">Set {index + 1}</span>
      <span className="col-span-2 w-16">{set.weight}kg</span>
      <span className="col-span-2 w-16">{set.rep_count} reps</span>
      <Button
        type="button"
        onClick={() => setIsEditing(true)}
        className="col-span-1"
        variant="ghost"
        aria-label="Edit set"
      >
        <Pencil className="w-4 h-4" />    
      </Button>
      <Button
        className="col-span-1"
        type="button"
        variant="ghost"
        onClick={onDelete}
        aria-label="Delete set"
      >
        <Trash className="w-4 h-4" />
      </Button>
    </div>
  )
}
