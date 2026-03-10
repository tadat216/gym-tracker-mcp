import { Calendar } from '@/components/ui/calendar'

interface WorkoutCalendarViewProps {
  currentMonth: Date
  workoutDates: Date[]
  isLoading: boolean
  onMonthChange: (month: Date) => void
  onDateSelect: (date: Date | undefined) => void
}

export function WorkoutCalendarView({
  currentMonth,
  workoutDates,
  isLoading,
  onMonthChange,
  onDateSelect,
}: WorkoutCalendarViewProps) {
  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Workout Log</h1>
      <Calendar
        mode="single"
        month={currentMonth}
        onMonthChange={onMonthChange}
        onSelect={onDateSelect}
        modifiers={{ hasWorkout: workoutDates }}
        modifiersClassNames={{ hasWorkout: 'day-has-workout' }}
        className="w-full md:w-auto"
      />
    </div>
  )
}
