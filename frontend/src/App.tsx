import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="font-medium">Exercise Library</span>
        </header>
        <main className="flex-1 p-4 max-w-3xl">
          {/* ExerciseLibrary wired in Task 7 */}
          <p className="text-muted-foreground text-sm">Loading exercise library...</p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
