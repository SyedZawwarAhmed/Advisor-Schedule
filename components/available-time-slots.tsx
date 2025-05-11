"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { addDays, format, isSameDay, startOfDay } from "date-fns"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AvailableTimeSlotsProps {
  slug: string
  onTimeSelect: (time: Date | null) => void
}

export function AvailableTimeSlots({ slug, onTimeSelect }: AvailableTimeSlotsProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Date[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [linkDetails, setLinkDetails] = useState<{ name: string, duration: number, maxDaysInAdvance: number } | null>(null)

  // Fetch available time slots for the selected date
  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true)
    setAvailableTimeSlots([])
    
    try {
      // Calculate start and end dates (7 days from selected date)
      const startDate = startOfDay(date).toISOString()
      const endDate = addDays(startOfDay(date), 7).toISOString()
      
      // Fetch available slots from API
      const response = await fetch(
        `/api/schedule/${slug}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch available time slots')
      }
      
      // Set link details
      if (data.link) {
        setLinkDetails({
          name: data.link.name,
          duration: data.link.duration,
          maxDaysInAdvance: data.link.maxDaysInAdvance || 30
        })
      }
      
      // Convert ISO strings to Date objects
      const slots = data.availableSlots.map((slot: string) => new Date(slot))
      setAvailableTimeSlots(slots)
    } catch (error) {
      console.error('Error fetching available slots:', error)
      toast.error('Failed to load available time slots')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch when component mounts
  useEffect(() => {
    fetchAvailableSlots(selectedDate)
  }, [slug])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setSelectedTime(null)
      onTimeSelect(null)
      fetchAvailableSlots(date)
    }
  }

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time)
    onTimeSelect(time)
  }

  // Filter slots for the selected date
  const slotsForSelectedDate = availableTimeSlots.filter(slot => 
    isSameDay(slot, selectedDate)
  )

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
            const maxDate = addDays(today, linkDetails?.maxDaysInAdvance || 30)
            return date < today || date > maxDate
          }}
          className="rounded-md border"
        />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Available Times</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : slotsForSelectedDate.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {slotsForSelectedDate.map((slot, index) => (
              <Button
                key={index}
                variant={
                  selectedTime && 
                  isSameDay(slot, selectedTime) &&
                  slot.getHours() === selectedTime.getHours() &&
                  slot.getMinutes() === selectedTime.getMinutes()
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
