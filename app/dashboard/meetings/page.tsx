"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Meeting = {
  id: string
  startTime: string
  endTime: string
  clientEmail: string
  clientLinkedIn: string | null
  status: string
  schedulingLink: {
    name: string
    duration: number
  }
  createdAt: string
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        // First fetch all upcoming meetings
        const upcomingResponse = await fetch('/api/meetings/upcoming')
        const upcomingData = await upcomingResponse.json()
        
        // Then fetch past meetings (later this could be paginated)
        const pastResponse = await fetch('/api/meetings/past')
        const pastData = await pastResponse.json()
        
        // Combine and sort by date (most recent first)
        const allMeetings = [
          ...(upcomingData.meetings || []),
          ...(pastData.meetings || [])
        ].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        
        setMeetings(allMeetings)
      } catch (error) {
        console.error('Error fetching meetings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [])

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
        <p className="text-muted-foreground">
          All your scheduled and past meetings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Meetings</CardTitle>
          <CardDescription>View and manage all your meetings</CardDescription>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground mb-4">You don't have any meetings yet</p>
              <Link href="/dashboard/links">
                <Button>Create a scheduling link</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Meeting Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getInitials(meeting.clientEmail)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{meeting.clientEmail}</span>
                          {meeting.clientLinkedIn && (
                            <span className="text-xs text-muted-foreground">
                              Has LinkedIn
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{meeting.schedulingLink.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{format(new Date(meeting.startTime), "PPP")}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(meeting.startTime), "p")} - {format(new Date(meeting.endTime), "p")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        meeting.status === "scheduled" 
                          ? "bg-blue-100 text-blue-800" 
                          : meeting.status === "completed" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/meetings/${meeting.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 