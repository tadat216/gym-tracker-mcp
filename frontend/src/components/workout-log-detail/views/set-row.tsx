import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { SetData } from '../types'
import { TrackingType } from '../../../api/model/trackingType'
import { Pencil, Trash } from 'lucide-react'

interface SetUpdatePayload {
  rep_count?: number
  weight?: number
  duration_sec?: number
}

interface SetRowProps {
  set: SetData
  index: number
  tracking_type: TrackingType
  onDelete: () => void
  onEdit: (setId: number, payload: SetUpdatePayload) => Promise<void>
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export function SetRow({ set, index, tracking_type, onDelete, onEdit }: SetRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editWeight, setEditWeight] = useState(String(set.weight ?? ''))
  const [editRepCount, setEditRepCount] = useState(String(set.rep_count ?? ''))
  const [editDurationSec, setEditDurationSec] = useState(String(set.duration_sec ?? ''))
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      let payload: SetUpdatePayload
      if (tracking_type === TrackingType.reps_weight) {
        payload = { rep_count: Number(editRepCount), weight: Number(editWeight) }
      } else if (tracking_type === TrackingType.bodyweight) {
        payload = {
          rep_count: Number(editRepCount),
          weight: editWeight ? Number(editWeight) : undefined,
        }
      } else {
        payload = { duration_sec: Number(editDurationSec) }
      }
      await onEdit(set.id, payload)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setEditWeight(String(set.weight ?? ''))
    setEditRepCount(String(set.rep_count ?? ''))
    setEditDurationSec(String(set.duration_sec ?? ''))
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-end gap-2 py-1">
        <span className="text-muted-foreground text-sm w-12">Set {index + 1}</span>
        {tracking_type === TrackingType.reps_weight && (
          <>
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
          </>
        )}
        {tracking_type === TrackingType.bodyweight && (
          <>
            <div className="flex items-end gap-0.5 flex-1">
              <Input
                type="number"
                value={editRepCount}
                onChange={(e) => setEditRepCount(e.target.value)}
                className="h-7 text-sm"
              />
              <p className="text-sm text-muted-foreground">reps</p>
            </div>
            <div className="flex items-end gap-0.5 flex-1">
              <Input
                type="number"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                placeholder="0"
                className="h-7 text-sm"
              />
              <p className="text-sm text-muted-foreground">kg (opt)</p>
            </div>
          </>
        )}
        {tracking_type === TrackingType.duration && (
          <div className="flex items-end gap-0.5 flex-1">
            <Input
              type="number"
              value={editDurationSec}
              onChange={(e) => setEditDurationSec(e.target.value)}
              className="h-7 text-sm"
            />
            <p className="text-sm text-muted-foreground">sec</p>
          </div>
        )}
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

  function renderDisplay() {
    if (tracking_type === TrackingType.reps_weight) {
      return <span className="col-span-4">{set.weight}kg × {set.rep_count} reps</span>
    }
    if (tracking_type === TrackingType.bodyweight) {
      const extra = (set.weight ?? 0) > 0 ? ` + ${set.weight}kg` : ''
      return <span className="col-span-4">{set.rep_count} reps{extra}</span>
    }
    // duration
    return <span className="col-span-4">{formatDuration(set.duration_sec ?? 0)}</span>
  }

  return (
    <div className="grid grid-cols-8 items-center gap-4 py-1 text-sm">
      <span className="col-span-2 text-muted-foreground w-12">Set {index + 1}</span>
      {renderDisplay()}
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
