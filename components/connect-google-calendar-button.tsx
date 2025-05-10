"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export function ConnectGoogleCalendarButton() {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // In a real implementation, this would redirect to Google OAuth
      console.log("Connecting to Google Calendar...")
      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
    } catch (error) {
      console.error("Failed to connect:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Button onClick={handleConnect} disabled={isConnecting}>
      <Calendar className="mr-2 h-4 w-4" />
      {isConnecting ? "Connecting..." : "Connect Google Calendar"}
    </Button>
  )
}
