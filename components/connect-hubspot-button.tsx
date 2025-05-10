"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

export function ConnectHubspotButton() {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // In a real implementation, this would redirect to Hubspot OAuth
      console.log("Connecting to Hubspot...")
      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
    } catch (error) {
      console.error("Failed to connect:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
      <Users className="mr-2 h-4 w-4" />
      {isConnecting ? "Connecting..." : "Connect Hubspot"}
    </Button>
  )
}
