import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { SchedulingWindowsList } from "@/components/scheduling-windows-list"

export default function WindowsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduling Windows</h1>
          <p className="text-muted-foreground">Define when you're available for meetings</p>
        </div>
        <Link href="/dashboard/windows/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Window
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Scheduling Windows</CardTitle>
          <CardDescription>These windows define when clients can book meetings with you</CardDescription>
        </CardHeader>
        <CardContent>
          <SchedulingWindowsList />
        </CardContent>
      </Card>
    </div>
  )
}
