import { useExerciseLibrary } from "./hooks"
import { ExerciseLibraryLoading, ExerciseLibraryView } from "./views"

export function ExerciseLibrary() {
  const {
    muscleGroups,
    exercises,
    isLoading,
    isAdding,
    newName,
    newVnName,
    setIsAdding,
    onNewNameChange,
    onNewVnNameChange,
    handleCreate,
    handleCancelAdd,
    handleDelete,
    isCreating,
  } = useExerciseLibrary()

  if (isLoading) return <ExerciseLibraryLoading />

  return (
    <ExerciseLibraryView
      muscleGroups={muscleGroups}
      exercises={exercises}
      isAdding={isAdding}
      isCreating={isCreating}
      newName={newName}
      newVnName={newVnName}
      onAdd={() => setIsAdding(true)}
      onCancelAdd={handleCancelAdd}
      onCreate={handleCreate}
      onDelete={handleDelete}
      onNewNameChange={onNewNameChange}
      onNewVnNameChange={onNewVnNameChange}
    />
  )
}
