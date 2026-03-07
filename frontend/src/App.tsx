import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import { ExerciseLibrary } from "@/components/exercise-library"

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" />
          <span className="font-medium">Exercise Library</span>
        </header>
        <main className="flex-1 p-4 max-w-3xl">
          <ExerciseLibrary />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
