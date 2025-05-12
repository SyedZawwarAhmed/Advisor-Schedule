"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

export function ConnectHubspotButton() {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/integrations/hubspot/connect')
      const data = await response.json()
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error('No auth URL received')
      }
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
