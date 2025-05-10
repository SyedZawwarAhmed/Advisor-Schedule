"use client"

import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { signIn } from "@/lib/auth"

export function LoginButton({ size, ...props }: ButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await signIn()
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleLogin} disabled={isLoading} size={size} {...props}>
      {isLoading ? "Signing in..." : "Sign in with Google"}
    </Button>
  )
}
