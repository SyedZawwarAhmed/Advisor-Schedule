import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateSchedulingLinkForm } from "@/components/create-scheduling-link-form"

export default function CreateLinkPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Scheduling Link</h1>
        <p className="text-muted-foreground">Create a new link for clients to schedule meetings with you</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Scheduling Link</CardTitle>
          <CardDescription>Configure your scheduling link settings and questions</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateSchedulingLinkForm />
        </CardContent>
      </Card>
    </div>
  )
}
