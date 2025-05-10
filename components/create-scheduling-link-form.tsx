"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export function CreateSchedulingLinkForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [duration, setDuration] = useState("30")
  const [maxDaysInAdvance, setMaxDaysInAdvance] = useState("30")
  const [hasUsageLimit, setHasUsageLimit] = useState(false)
  const [usageLimit, setUsageLimit] = useState("10")
  const [hasExpirationDate, setHasExpirationDate] = useState(false)
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)
  const [questions, setQuestions] = useState([{ id: "1", text: "What are your financial goals?" }])

  const addQuestion = () => {
    const newId = (Number.parseInt(questions[questions.length - 1]?.id || "0") + 1).toString()
    setQuestions([...questions, { id: newId, text: "" }])
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)))
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    // Generate slug from name
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation, this would save the scheduling link
    console.log({
      name,
      slug,
      isActive,
      duration,
      maxDaysInAdvance,
      usageLimit: hasUsageLimit ? Number.parseInt(usageLimit) : null,
      expirationDate: hasExpirationDate ? expirationDate : null,
      questions,
    })
    router.push("/dashboard/links")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Link Name</Label>
          <Input id="name" placeholder="e.g., Initial Consultation" value={name} onChange={handleNameChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">Link URL</Label>
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">
              {typeof window !== "undefined" ? window.location.origin : ""}/schedule/
            </span>
            <Input
              id="slug"
              placeholder="initial-consultation"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="flex-1"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          <Label htmlFor="active">Active</Label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Meeting Settings</h3>

        <div className="grid gap-2">
          <Label htmlFor="duration">Meeting Duration (minutes)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="duration">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="maxDaysInAdvance">Maximum Days in Advance</Label>
          <Select value={maxDaysInAdvance} onValueChange={setMaxDaysInAdvance}>
            <SelectTrigger id="maxDaysInAdvance">
              <SelectValue placeholder="Select days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Link Restrictions</h3>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch id="hasUsageLimit" checked={hasUsageLimit} onCheckedChange={setHasUsageLimit} />
            <Label htmlFor="hasUsageLimit">Limit number of uses</Label>
          </div>

          {hasUsageLimit && (
            <div className="grid gap-2 pl-6">
              <Label htmlFor="usageLimit">Maximum Uses</Label>
              <Input
                id="usageLimit"
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                required={hasUsageLimit}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch id="hasExpirationDate" checked={hasExpirationDate} onCheckedChange={setHasExpirationDate} />
            <Label htmlFor="hasExpirationDate">Set expiration date</Label>
          </div>

          {hasExpirationDate && (
            <div className="grid gap-2 pl-6">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="expirationDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expirationDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expirationDate ? format(expirationDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expirationDate}
                    onSelect={setExpirationDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Questions</h3>
          <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>

        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="flex items-start gap-2">
              <Textarea
                value={question.text}
                onChange={(e) => updateQuestion(question.id, e.target.value)}
                placeholder="Enter your question"
                className="flex-1"
              />
              {questions.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(question.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/links")}>
          Cancel
        </Button>
        <Button type="submit">Create Link</Button>
      </div>
    </form>
  )
}
