import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateSchedulingWindowForm } from "@/components/create-scheduling-window-form"

export default function CreateWindowPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Scheduling Window</h1>
        <p className="text-muted-foreground">Define when you're available for meetings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Scheduling Window</CardTitle>
          <CardDescription>Set up your availability for specific days and times</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateSchedulingWindowForm />
        </CardContent>
      </Card>
    </div>
  )
}
