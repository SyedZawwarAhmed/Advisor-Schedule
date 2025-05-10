"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Link2, Clock, Settings, LogOut, Users, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth"

export function Sidebar() {
  const pathname = usePathname()

  const routes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Calendar,
    },
    {
      name: "Calendar",
      href: "/dashboard/calendar",
      icon: CalendarDays,
    },
    {
      name: "Calendar Connections",
      href: "/dashboard/calendars",
      icon: Calendar,
    },
    {
      name: "Scheduling Windows",
      href: "/dashboard/windows",
      icon: Clock,
    },
    {
      name: "Scheduling Links",
      href: "/dashboard/links",
      icon: Link2,
    },
    {
      name: "Integrations",
      href: "/dashboard/integrations",
      icon: Users,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="flex flex-col w-64 border-r bg-gray-50">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">AdvisorSchedule</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100",
              pathname === route.href ? "bg-gray-100 text-primary" : "text-gray-500",
            )}
          >
            <route.icon className="h-4 w-4" />
            {route.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <form action={signOut}>
          <Button variant="outline" className="w-full justify-start" type="submit">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
