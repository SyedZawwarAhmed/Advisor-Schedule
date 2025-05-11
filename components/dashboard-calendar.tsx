"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

type Meeting = {
  id: string
  startTime: string
  endTime: string
  clientEmail: string
  schedulingLink: {
    name: string
  }
}

// Time slots for the day view (business hours only)
const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 7 // Start from 7 AM
  const hour12 = hour % 12 || 12
  const ampm = hour < 12 ? "AM" : "PM"
  return `${hour12}:00 ${ampm}`
})

export function DashboardCalendar() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date()

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

  // Get event position and height based on time
  const getEventStyle = (meeting: Meeting) => {
    const startHour = new Date(meeting.startTime).getHours()
    const startMinute = new Date(meeting.startTime).getMinutes()
    const endHour = new Date(meeting.endTime).getHours()
    const endMinute = new Date(meeting.endTime).getMinutes()

    // Calculate relative to business hours (7 AM - 7 PM)
    const startPercentage = Math.max(0, (startHour + startMinute / 60 - 7) * (100 / 12))
    const endPercentage = Math.min(100, (endHour + endMinute / 60 - 7) * (100 / 12))
    const height = endPercentage - startPercentage

    return {
      top: `${startPercentage}%`,
      height: `${height}%`,
      backgroundColor: "#3b82f6",
    }
  }

  // Filter events for today
  const todaysMeetings = meetings.filter((meeting) => {
    const meetingDate = new Date(meeting.startTime)
    return (
      meetingDate.getDate() === today.getDate() &&
      meetingDate.getMonth() === today.getMonth() &&
      meetingDate.getFullYear() === today.getFullYear()
    )
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="custom-calendar" style={{ height: "400px" }}>
      <div className="day-header">
        <div className="day-name">Today</div>
        <div className="day-date">{format(today, "MMMM d, yyyy")}</div>
      </div>

      <div className="time-grid">
        {timeSlots.map((timeSlot, index) => (
          <div key={index} className="time-slot">
            <div className="time-label">{timeSlot}</div>
            <div className="time-cell"></div>
          </div>
        ))}

        {todaysMeetings.map((meeting) => (
          <div key={meeting.id} className="calendar-event" style={getEventStyle(meeting)}>
            <div className="event-title">{meeting.schedulingLink.name}</div>
            <div className="event-time">
              {format(new Date(meeting.startTime), "h:mm a")} - {format(new Date(meeting.endTime), "h:mm a")}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
