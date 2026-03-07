export function ExerciseLibraryLoading() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  )
}
