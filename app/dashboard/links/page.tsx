import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { SchedulingLinksList } from "@/components/scheduling-links-list"

export default function LinksPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduling Links</h1>
          <p className="text-muted-foreground">Create and manage your scheduling links</p>
        </div>
        <Link href="/dashboard/links/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Link
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Scheduling Links</CardTitle>
          <CardDescription>Share these links with your clients to let them book meetings</CardDescription>
        </CardHeader>
        <CardContent>
          <SchedulingLinksList />
        </CardContent>
      </Card>
    </div>
  )
}
