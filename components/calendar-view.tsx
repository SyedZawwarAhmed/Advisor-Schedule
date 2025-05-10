"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, subDays } from "date-fns"

// Mock data for connected calendars
const connectedCalendars = [
  { id: "work", name: "Work Calendar", color: "#3b82f6" },
  { id: "personal", name: "Personal Calendar", color: "#10b981" },
]

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
    id: 2,
    title: "Portfolio Review with Sarah Johnson",
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(15, 0, 0, 0)),
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

// Time slots for the day view
const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12
  const ampm = i < 12 ? "AM" : "PM"
  return `${hour}:00 ${ampm}`
})

// Days of the week
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState("day")
  const [selectedCalendars, setSelectedCalendars] = useState(connectedCalendars.map((cal) => cal.id))

  // Filter events based on selected calendars and date
  const filteredEvents = mockEvents.filter((event) => {
    const eventDate = new Date(event.start)
    const selectedDateObj = new Date(selectedDate)

    return (
      selectedCalendars.includes(event.calendarId) &&
      eventDate.getDate() === selectedDateObj.getDate() &&
      eventDate.getMonth() === selectedDateObj.getMonth() &&
      eventDate.getFullYear() === selectedDateObj.getFullYear()
    )
  })

  // Toggle calendar selection
  const toggleCalendar = (calendarId: string) => {
    if (selectedCalendars.includes(calendarId)) {
      setSelectedCalendars(selectedCalendars.filter((id) => id !== calendarId))
    } else {
      setSelectedCalendars([...selectedCalendars, calendarId])
    }
  }

  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1))
  }

  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1))
  }

  // Navigate to today
  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Get event position and height based on time
  const getEventStyle = (event: any) => {
    const startHour = new Date(event.start).getHours()
    const startMinute = new Date(event.start).getMinutes()
    const endHour = new Date(event.end).getHours()
    const endMinute = new Date(event.end).getMinutes()

    const startPercentage = (startHour + startMinute / 60) * (100 / 24)
    const endPercentage = (endHour + endMinute / 60) * (100 / 24)
    const height = endPercentage - startPercentage

    const calendar = connectedCalendars.find((cal) => cal.id === event.calendarId)
    const backgroundColor = calendar?.color || "#3b82f6"

    return {
      top: `${startPercentage}%`,
      height: `${height}%`,
      backgroundColor,
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>View and manage your schedule</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {connectedCalendars.map((calendar) => (
              <Badge
                key={calendar.id}
                variant={selectedCalendars.includes(calendar.id) ? "default" : "outline"}
                className="cursor-pointer"
                style={{
                  backgroundColor: selectedCalendars.includes(calendar.id) ? calendar.color : "transparent",
                  color: selectedCalendars.includes(calendar.id) ? "white" : "inherit",
                  borderColor: calendar.color,
                }}
                onClick={() => toggleCalendar(calendar.id)}
              >
                {calendar.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="font-medium">{format(selectedDate, "MMMM d, yyyy")}</span>
          </div>

          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {view === "day" && (
          <div className="custom-calendar">
            <div className="day-header">
              <div className="day-name">{daysOfWeek[selectedDate.getDay()]}</div>
              <div className="day-date">{format(selectedDate, "d")}</div>
            </div>

            <div className="time-grid">
              {timeSlots.map((timeSlot, index) => (
                <div key={index} className="time-slot">
                  <div className="time-label">{timeSlot}</div>
                  <div className="time-cell"></div>
                </div>
              ))}

              {filteredEvents.map((event) => (
                <div key={event.id} className="calendar-event" style={getEventStyle(event)}>
                  <div className="event-title">{event.title}</div>
                  <div className="event-time">
                    {format(new Date(event.start), "h:mm a")} - {format(new Date(event.end), "h:mm a")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view !== "day" && (
          <div className="flex items-center justify-center h-[600px] border rounded-md p-4">
            <p className="text-muted-foreground">{view.charAt(0).toUpperCase() + view.slice(1)} view is coming soon.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
