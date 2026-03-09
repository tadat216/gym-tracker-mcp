import { useNavigate } from 'react-router-dom'
import { useWorkoutCalendar } from './hooks'
import { WorkoutCalendarView } from './views'

export function WorkoutCalendarContainer() {
  const navigate = useNavigate()
  const { currentMonth, setCurrentMonth, workoutDates, isLoading } = useWorkoutCalendar()

  function handleDateSelect(date: Date | undefined) {
    if (!date) return
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    navigate(`/workout-log/${y}-${m}-${d}`)
  }

  return (
    <WorkoutCalendarView
      currentMonth={currentMonth}
      workoutDates={workoutDates}
      isLoading={isLoading}
      onMonthChange={setCurrentMonth}
      onDateSelect={handleDateSelect}
    />
  )
}
