"use client"

import { useState, useEffect, use } from "react"
import { BookingForm } from "@/components/booking-form"
import { AvailableTimeSlots } from "@/components/available-time-slots"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function SchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [link, setLink] = useState<{
    id: string
    name: string
    slug: string
    duration: number
    maxDaysInAdvance: number
    questions: { id: string, text: string }[]
  } | null>(null)
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)

  useEffect(() => {
    const fetchLinkDetails = async () => {
      setLoading(true)
      try {
        // Get the first available date to fetch initial data
        const startDate = new Date().toISOString()
        const endDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
        
        const response = await fetch(
          `/api/schedule/${resolvedParams.slug}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
        )
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch scheduling link')
        }
        
        setLink({
          id: data.link.id || "unknown",
          name: data.link.name,
          slug: resolvedParams.slug,
          duration: data.link.duration,
          maxDaysInAdvance: data.link.maxDaysInAdvance || 30,
          questions: data.questions || []
        })
      } catch (error) {
        console.error('Error fetching scheduling link:', error)
        setError('This scheduling link is not available or has been removed')
        toast.error('Failed to load scheduling link')
      } finally {
        setLoading(false)
      }
    }
    
    fetchLinkDetails()
  }, [resolvedParams.slug])

  const handleTimeSelect = (time: Date | null) => {
    setSelectedTime(time)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !link) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link Not Found</CardTitle>
            <CardDescription>
              {error || "The scheduling link you're looking for doesn't exist or has been removed."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{link.name}</CardTitle>
          <CardDescription>Duration: {link.duration} minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <AvailableTimeSlots 
              slug={link.slug} 
              onTimeSelect={handleTimeSelect} 
            />
            <BookingForm 
              questions={link.questions} 
              slug={link.slug}
              selectedTime={selectedTime} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
