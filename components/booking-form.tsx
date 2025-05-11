"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Question {
  id: string
  text: string
}

interface BookingFormProps {
  questions: Question[]
  slug: string
  selectedTime: Date | null
}

export function BookingForm({ questions, slug, selectedTime }: BookingFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTime) {
      toast.error("Please select a time slot first")
      return
    }
    
    setIsSubmitting(true)

    try {
      // Format the answers for the API
      const formattedAnswers = questions.map(question => ({
        questionId: question.id,
        text: answers[question.id] || ""
      }))

      // Submit booking to the API
      const response = await fetch(`/api/schedule/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: selectedTime.toISOString(),
          clientEmail: email,
          clientLinkedIn: linkedin,
          answers: formattedAnswers
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule meeting')
      }

      toast.success("Meeting scheduled successfully")
      
      // Redirect to confirmation page
      router.push("/schedule/confirmation")
    } catch (error) {
      console.error("Failed to book meeting:", error)
      toast.error(error instanceof Error ? error.message : "Failed to schedule meeting")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedin">LinkedIn Profile</Label>
        <Input
          id="linkedin"
          type="url"
          placeholder="https://linkedin.com/in/yourprofile"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">Optional - helps the advisor prepare for your meeting</p>
      </div>

      {questions.map((question) => (
        <div key={question.id} className="space-y-2">
          <Label htmlFor={`question-${question.id}`}>{question.text}</Label>
          <Textarea
            id={`question-${question.id}`}
            placeholder="Your answer"
            value={answers[question.id] || ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={isSubmitting || !selectedTime}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Scheduling...
          </>
        ) : (
          'Schedule Meeting'
        )}
      </Button>
    </form>
  )
}
