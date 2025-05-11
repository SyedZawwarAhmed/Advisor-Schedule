"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type TimeSlot = {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
}

type SchedulingWindow = {
  id: string
  name: string
  isActive: boolean
  timeSlots: TimeSlot[]
}

export function SchedulingWindowsList() {
  const [windows, setWindows] = useState<SchedulingWindow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteWindowId, setDeleteWindowId] = useState<string | null>(null)
  const [updatingWindowId, setUpdatingWindowId] = useState<string | null>(null)

  const fetchWindows = async () => {
    try {
      const response = await fetch('/api/scheduling/windows')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch scheduling windows')
      }

      setWindows(data.windows || [])
    } catch (error) {
      console.error('Error fetching scheduling windows:', error)
      toast.error('Failed to load scheduling windows')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWindows()
  }, [])

  const toggleWindowActive = async (window: SchedulingWindow) => {
    setUpdatingWindowId(window.id)
    
    try {
      const response = await fetch(`/api/scheduling/windows/${window.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: window.name,
          isActive: !window.isActive,
          timeSlots: window.timeSlots,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update scheduling window')
      }

      // Update the local state
      setWindows(prevWindows => 
        prevWindows.map(w => 
          w.id === window.id 
            ? { ...w, isActive: !w.isActive } 
            : w
        )
      )
      
      toast.success(`${window.name} ${!window.isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Error updating window:', error)
      toast.error('Failed to update window status')
    } finally {
      setUpdatingWindowId(null)
    }
  }

  const deleteWindow = async () => {
    if (!deleteWindowId) return
    
    try {
      const response = await fetch(`/api/scheduling/windows/${deleteWindowId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete scheduling window')
      }

      // Remove from local state
      setWindows(prevWindows => prevWindows.filter(w => w.id !== deleteWindowId))
      toast.success('Scheduling window deleted')
    } catch (error) {
      console.error('Error deleting window:', error)
      toast.error('Failed to delete window')
    } finally {
      setDeleteWindowId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (windows.length === 0) {
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
    <>
      <div className="space-y-6">
        {windows.map((window) => (
          <div key={window.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">{window.name}</h3>
                <p className="text-sm text-muted-foreground">{window.timeSlots.length} time slots</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={window.isActive} 
                  disabled={updatingWindowId === window.id}
                  onCheckedChange={() => toggleWindowActive(window)} 
                />
                <Link href={`/dashboard/windows/${window.id}/edit`}>
                  <Button variant="ghost" size="icon" disabled={updatingWindowId === window.id}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDeleteWindowId(window.id)}
                  disabled={updatingWindowId === window.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              {window.timeSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between text-sm border-t pt-2">
                  <span className="font-medium">{slot.dayOfWeek}</span>
                  <span className="text-muted-foreground">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteWindowId} onOpenChange={(open) => !open && setDeleteWindowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scheduling window and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteWindow} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
