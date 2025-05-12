"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Link2, Clock, Users, LogOut, CalendarDays, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOutAction } from "@/app/actions/auth"

export function Sidebar() {
  const pathname = usePathname()

  const routes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Calendar,
    },
    // {
    //   name: "Calendar",
    //   href: "/dashboard/calendar",
    //   icon: CalendarDays,
    // },
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
      name: "Meetings",
      href: "/dashboard/meetings",
      icon: ClipboardList,
    },
    {
      name: "Integrations",
      href: "/dashboard/integrations",
      icon: Users,
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
        <form action={signOutAction}>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 mt-1" 
            type="submit"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign out
          </Button>
        </form>
      </nav>
    </div>
  )
}
