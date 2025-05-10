"use client"
import { format } from "date-fns"

// Mock data for calendar events
const mockEvents = [
  {
    id: 1,
    title: "Initial Consultation with John Smith",
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(10, 30, 0, 0)),
    calendarId: "work",
  },
  {
    id: 3,
    title: "Team Meeting",
    start: new Date(new Date().setHours(13, 0, 0, 0)),
    end: new Date(new Date().setHours(14, 0, 0, 0)),
    calendarId: "work",
  },
  {
    id: 4,
    title: "Lunch with Client",
    start: new Date(new Date().setHours(12, 0, 0, 0)),
    end: new Date(new Date().setHours(13, 30, 0, 0)),
    calendarId: "personal",
  },
  {
    id: 5,
    title: "Gym",
    start: new Date(new Date().setHours(7, 0, 0, 0)),
    end: new Date(new Date().setHours(8, 0, 0, 0)),
    calendarId: "personal",
  },
]

// Time slots for the day view (business hours only)
const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 7 // Start from 7 AM
  const hour12 = hour % 12 || 12
  const ampm = hour < 12 ? "AM" : "PM"
  return `${hour12}:00 ${ampm}`
})

// Calendar colors
const calendarColors = {
  work: "#3b82f6",
  personal: "#10b981",
}

export function DashboardCalendar() {
  const today = new Date()

  // Get event position and height based on time
  const getEventStyle = (event: any) => {
    const startHour = new Date(event.start).getHours()
    const startMinute = new Date(event.start).getMinutes()
    const endHour = new Date(event.end).getHours()
    const endMinute = new Date(event.end).getMinutes()

    // Calculate relative to business hours (7 AM - 7 PM)
    const startPercentage = Math.max(0, (startHour + startMinute / 60 - 7) * (100 / 12))
    const endPercentage = Math.min(100, (endHour + endMinute / 60 - 7) * (100 / 12))
    const height = endPercentage - startPercentage

    const backgroundColor = calendarColors[event.calendarId as keyof typeof calendarColors] || "#3b82f6"

    return {
      top: `${startPercentage}%`,
      height: `${height}%`,
      backgroundColor,
    }
  }

  // Filter events for today
  const todaysEvents = mockEvents.filter((event) => {
    const eventDate = new Date(event.start)
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    )
  })

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

        {todaysEvents.map((event) => (
          <div key={event.id} className="calendar-event" style={getEventStyle(event)}>
            <div className="event-title">{event.title}</div>
            <div className="event-time">
              {format(new Date(event.start), "h:mm a")} - {format(new Date(event.end), "h:mm a")}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
