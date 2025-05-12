"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"

export function ConnectGoogleCalendarButton() {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/integrations/google-calendar/connect')
      const data = await response.json()
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error('Failed to get authorization URL')
      }
    } catch (error) {
      console.error("Failed to connect:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Button onClick={handleConnect} disabled={isConnecting}>
      <Plus className="mr-2 h-4 w-4" />
      {isConnecting ? "Connecting..." : "Connect Another Calendar"}
    </Button>
  )
}
