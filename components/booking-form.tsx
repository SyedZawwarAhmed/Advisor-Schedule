"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface Question {
  id: string
  text: string
}

interface BookingFormProps {
  questions: Question[]
}

export function BookingForm({ questions }: BookingFormProps) {
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
    setIsSubmitting(true)

    try {
      // In a real implementation, this would submit the booking to the server
      console.log({
        email,
        linkedin,
        answers,
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Meeting scheduled",
        description: "Your meeting has been scheduled successfully.",
      })

      // Redirect to confirmation page
      router.push("/schedule/confirmation")
    } catch (error) {
      console.error("Failed to book meeting:", error)
      toast({
        title: "Error",
        description: "Failed to schedule the meeting. Please try again.",
        variant: "destructive",
      })
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
          required
        />
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
          />
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
      </Button>
    </form>
  )
}
