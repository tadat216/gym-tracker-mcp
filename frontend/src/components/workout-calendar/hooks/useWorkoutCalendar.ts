import { useState } from 'react'
import { useGetCalendarApiWorkoutsCalendarGet } from '@/api/workouts/workouts'
import type { CalendarData } from '../types'

export function useWorkoutCalendar() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  const { data, isLoading } = useGetCalendarApiWorkoutsCalendarGet({
    month: currentMonth.getMonth() + 1,
    year: currentMonth.getFullYear(),
  })

  const calendarData = data as CalendarData | undefined

  const workoutDates: Date[] = (calendarData?.workout_dates ?? []).map((str) => {
    const [y, m, d] = str.split('-').map(Number)
    return new Date(y, m - 1, d)
  })

  return {
    currentMonth,
    setCurrentMonth,
    workoutDates,
    isLoading,
  }
}
