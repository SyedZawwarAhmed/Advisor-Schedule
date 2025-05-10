"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { addDays, format, isSameDay } from "date-fns"

// Mock data for available time slots
const generateMockTimeSlots = (date: Date, duration: number) => {
  // Generate time slots between 9 AM and 5 PM
  const slots = []
  const startHour = 9
  const endHour = 17
  const slotInterval = duration

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotInterval) {
      // Skip some slots randomly to simulate unavailability
      if (Math.random() > 0.3) {
        const slotDate = new Date(date)
        slotDate.setHours(hour, minute, 0, 0)
        slots.push(slotDate)
      }
    }
  }

  return slots
}

interface AvailableTimeSlotsProps {
  duration: number
  maxDaysInAdvance: number
}

export function AvailableTimeSlots({ duration, maxDaysInAdvance }: AvailableTimeSlotsProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)

  const availableTimeSlots = generateMockTimeSlots(selectedDate, duration)

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setSelectedTime(null)
    }
  }

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time)
    // In a real implementation, this would update the parent component
    // to show the booking form
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Select a Date</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const maxDate = addDays(today, maxDaysInAdvance)
            return date < today || date > maxDate
          }}
          className="rounded-md border"
        />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Available Times</h3>
        {availableTimeSlots.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {availableTimeSlots.map((slot, index) => (
              <Button
                key={index}
                variant={
                  isSameDay(slot, selectedTime || new Date(0)) &&
                  slot.getHours() === (selectedTime?.getHours() || 0) &&
                  slot.getMinutes() === (selectedTime?.getMinutes() || 0)
                    ? "default"
                    : "outline"
                }
                className="w-full"
                onClick={() => handleTimeSelect(slot)}
              >
                {format(slot, "h:mm a")}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No available times on this date. Please select another date.
          </p>
        )}
      </div>
    </div>
  )
}
