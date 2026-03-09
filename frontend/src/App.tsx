import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import { ExerciseLibrary } from "@/components/exercise-library"
import { WorkoutCalendar } from "@/components/workout-calendar"
import { WorkoutLogDetail } from "@/components/workout-log-detail"
import { Navigate, Route, Routes } from "react-router-dom"

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" />
        </header>
        <main className="flex-1 p-4 max-w-3xl">
          <Routes>
            <Route path="/exercise-library" element={<ExerciseLibrary />} />
            <Route path="/workout-log" element={<WorkoutCalendar />} />
            <Route path="/workout-log/:date" element={<WorkoutLogDetail />} />
            <Route path="/" element={<Navigate to="/workout-log" replace />} />
          </Routes>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
