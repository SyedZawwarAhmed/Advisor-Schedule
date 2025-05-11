"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { Loader2 } from "lucide-react"

type Meeting = {
  id: string
  startTime: string
  endTime: string
  clientEmail: string
  status: string
  schedulingLink: {
    name: string
    duration: number
  }
}

export function UpcomingMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await fetch('/api/meetings/upcoming')
        const data = await response.json()
        setMeetings(data.meetings)
      } catch (error) {
        console.error('Error fetching meetings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <p className="text-muted-foreground">No upcoming meetings</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <Card key={meeting.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center p-4">
              <Avatar className="h-10 w-10 mr-4">
                <AvatarFallback>
                  {meeting.clientEmail
                    .split("@")[0]
                    .split(".")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{meeting.schedulingLink.name}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {meeting.clientEmail}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">{formatDate(new Date(meeting.startTime))}</p>
                <p className="text-xs text-muted-foreground">{meeting.schedulingLink.duration} minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
