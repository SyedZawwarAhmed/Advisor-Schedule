"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

// Mock data for upcoming meetings
const upcomingMeetings = [
  {
    id: "1",
    title: "Initial Consultation",
    date: new Date(Date.now() + 86400000), // Tomorrow
    duration: 30,
    client: {
      name: "John Smith",
      email: "john@example.com",
      avatar: "",
    },
  },
  {
    id: "2",
    title: "Portfolio Review",
    date: new Date(Date.now() + 86400000 * 2), // Day after tomorrow
    duration: 60,
    client: {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      avatar: "",
    },
  },
  {
    id: "3",
    title: "Financial Planning",
    date: new Date(Date.now() + 86400000 * 3), // 3 days from now
    duration: 45,
    client: {
      name: "Michael Brown",
      email: "michael@example.com",
      avatar: "",
    },
  },
]

export function UpcomingMeetings() {
  if (upcomingMeetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <p className="text-muted-foreground">No upcoming meetings</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {upcomingMeetings.map((meeting) => (
        <Card key={meeting.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center p-4">
              <Avatar className="h-10 w-10 mr-4">
                <AvatarImage src={meeting.client.avatar || "/placeholder.svg"} alt={meeting.client.name} />
                <AvatarFallback>
                  {meeting.client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{meeting.title}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {meeting.client.name} ({meeting.client.email})
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">{formatDate(meeting.date)}</p>
                <p className="text-xs text-muted-foreground">{meeting.duration} minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
