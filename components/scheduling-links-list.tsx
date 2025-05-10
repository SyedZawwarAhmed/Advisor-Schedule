"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Copy, Edit, ExternalLink, Trash2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

// Mock data for scheduling links
const schedulingLinks = [
  {
    id: "1",
    name: "Initial Consultation",
    slug: "initial-consultation",
    active: true,
    duration: 30,
    maxDaysInAdvance: 30,
    usageLimit: 10,
    usageCount: 3,
    expirationDate: "2025-12-31",
    questions: [
      { id: "q1", text: "What are your financial goals?" },
      { id: "q2", text: "What concerns do you have?" },
    ],
  },
  {
    id: "2",
    name: "Portfolio Review",
    slug: "portfolio-review",
    active: true,
    duration: 60,
    maxDaysInAdvance: 14,
    usageLimit: null,
    usageCount: 5,
    expirationDate: null,
    questions: [{ id: "q1", text: "What is your current portfolio allocation?" }],
  },
]

export function SchedulingLinksList() {
  const [links, setLinks] = useState(schedulingLinks)

  const copyLink = (slug: string) => {
    const baseUrl = window.location.origin
    const fullUrl = `${baseUrl}/schedule/${slug}`
    navigator.clipboard.writeText(fullUrl)
    toast({
      title: "Link copied",
      description: "The scheduling link has been copied to your clipboard.",
    })
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <p className="text-muted-foreground">No scheduling links created yet</p>
        <Link href="/dashboard/links/create" className="mt-4">
          <Button>Create your first link</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {links.map((link) => (
        <div key={link.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{link.name}</h3>
                {link.usageLimit && (
                  <Badge variant="outline">
                    {link.usageCount}/{link.usageLimit} uses
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {link.duration} minutes • {link.questions.length} questions
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={link.active} />
              <Button variant="ghost" size="icon" onClick={() => copyLink(link.slug)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Link href={`/schedule/${link.slug}`} target="_blank">
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/dashboard/links/${link.id}/edit`}>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded text-sm font-mono break-all">
            {`${typeof window !== "undefined" ? window.location.origin : ""}/schedule/${link.slug}`}
          </div>

          {link.questions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Questions</h4>
              <ul className="text-sm space-y-1">
                {link.questions.map((question) => (
                  <li key={question.id} className="text-muted-foreground">
                    • {question.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
