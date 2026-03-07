import { Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type {
  ExerciseRowReadViewProps,
  ExerciseRowEditViewProps,
  ExerciseRowDeleteDialogProps,
} from "../types"

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

export function ExerciseRowDeleteDialog({
  exerciseName,
  open,
  onOpenChange,
  onConfirm,
}: ExerciseRowDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete exercise?</AlertDialogTitle>
          <AlertDialogDescription>
            "{exerciseName}" will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
