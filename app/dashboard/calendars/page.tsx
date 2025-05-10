import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Plus, Trash2 } from "lucide-react"
import { ConnectGoogleCalendarButton } from "@/components/connect-google-calendar-button"

// Mock data for connected calendars
const connectedCalendars = [
  {
    id: "1",
    name: "Work Calendar",
    email: "user@example.com",
    provider: "Google",
    connected: true,
  },
]

export default function CalendarsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar Connections</h1>
        <p className="text-muted-foreground">Connect your calendars to manage your availability</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {connectedCalendars.map((calendar) => (
          <Card key={calendar.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{calendar.name}</CardTitle>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>{calendar.email}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Connected</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" size="sm" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </CardFooter>
          </Card>
        ))}

        <Card className="flex flex-col items-center justify-center p-6 border-dashed">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Connect a Calendar</h3>
              <p className="text-sm text-muted-foreground">Add a Google Calendar to manage your availability</p>
            </div>
            <ConnectGoogleCalendarButton />
          </div>
        </Card>
      </div>
    </div>
  )
}
