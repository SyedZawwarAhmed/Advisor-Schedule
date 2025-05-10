"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4)
  const minute = (i % 4) * 15
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
})

export function CreateSchedulingWindowForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [slots, setSlots] = useState([{ day: "Monday", startTime: "09:00", endTime: "17:00" }])

  const addSlot = () => {
    setSlots([...slots, { day: "Monday", startTime: "09:00", endTime: "17:00" }])
  }

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index))
  }

  const updateSlot = (index: number, field: string, value: string) => {
    const newSlots = [...slots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setSlots(newSlots)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation, this would save the scheduling window
    console.log({ name, isActive, slots })
    router.push("/dashboard/windows")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Window Name</Label>
          <Input
            id="name"
            placeholder="e.g., Morning Hours"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          <Label htmlFor="active">Active</Label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Time Slots</h3>
          <Button type="button" variant="outline" size="sm" onClick={addSlot}>
            <Plus className="mr-2 h-4 w-4" />
            Add Slot
          </Button>
        </div>

        {slots.map((slot, index) => (
          <div key={index} className="grid gap-4 p-4 border rounded-lg">
            <div className="grid gap-2">
              <Label>Day of Week</Label>
              <Select value={slot.day} onValueChange={(value) => updateSlot(index, "day", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Time</Label>
                <Select value={slot.startTime} onValueChange={(value) => updateSlot(index, "startTime", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={`start-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>End Time</Label>
                <Select value={slot.endTime} onValueChange={(value) => updateSlot(index, "endTime", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="End time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={`end-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {slots.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-self-end"
                onClick={() => removeSlot(index)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/windows")}>
          Cancel
        </Button>
        <Button type="submit">Save Window</Button>
      </div>
    </form>
  )
}
