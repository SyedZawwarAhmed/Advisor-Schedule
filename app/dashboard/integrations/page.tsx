import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar } from "lucide-react"
import { ConnectHubspotButton } from "@/components/connect-hubspot-button"

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Connect your external services</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Google Calendar</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Connect your Google Calendar to manage your availability</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Connected (1 calendar)</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/dashboard/calendars">Manage Calendars</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Hubspot CRM</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Connect Hubspot to enrich meeting data with client information</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="text-sm text-muted-foreground">Not connected</span>
            </div>
          </CardContent>
          <CardFooter>
            <ConnectHubspotButton />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
