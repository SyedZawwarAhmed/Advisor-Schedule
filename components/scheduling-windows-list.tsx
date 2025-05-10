"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"

// Mock data for scheduling windows
const schedulingWindows = [
  {
    id: "1",
    name: "Morning Hours",
    active: true,
    slots: [
      { day: "Monday", startTime: "09:00", endTime: "12:00" },
      { day: "Tuesday", startTime: "09:00", endTime: "12:00" },
      { day: "Wednesday", startTime: "09:00", endTime: "12:00" },
      { day: "Thursday", startTime: "09:00", endTime: "12:00" },
      { day: "Friday", startTime: "09:00", endTime: "12:00" },
    ],
  },
  {
    id: "2",
    name: "Afternoon Hours",
    active: true,
    slots: [
      { day: "Monday", startTime: "13:00", endTime: "17:00" },
      { day: "Tuesday", startTime: "13:00", endTime: "17:00" },
      { day: "Wednesday", startTime: "13:00", endTime: "17:00" },
      { day: "Thursday", startTime: "13:00", endTime: "17:00" },
      { day: "Friday", startTime: "13:00", endTime: "17:00" },
    ],
  },
]

export function SchedulingWindowsList() {
  if (schedulingWindows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <p className="text-muted-foreground">No scheduling windows created yet</p>
        <Link href="/dashboard/windows/create" className="mt-4">
          <Button>Create your first window</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {schedulingWindows.map((window) => (
        <div key={window.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">{window.name}</h3>
              <p className="text-sm text-muted-foreground">{window.slots.length} time slots</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={window.active} />
              <Link href={`/dashboard/windows/${window.id}/edit`}>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            {window.slots.map((slot, index) => (
              <div key={index} className="flex items-center justify-between text-sm border-t pt-2">
                <span className="font-medium">{slot.day}</span>
                <span className="text-muted-foreground">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
