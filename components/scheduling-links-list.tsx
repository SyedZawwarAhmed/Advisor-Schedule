"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Copy, Edit, ExternalLink, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
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

type Question = {
  id: string
  text: string
}

type SchedulingLink = {
  id: string
  name: string
  slug: string
  isActive: boolean
  duration: number
  maxDaysInAdvance: number
  usageLimit: number | null
  usageCount: number
  expirationDate: string | null
  questions: Question[]
  _count?: {
    meetings: number
  }
}

export function SchedulingLinksList() {
  const [links, setLinks] = useState<SchedulingLink[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null)
  const [updatingLinkId, setUpdatingLinkId] = useState<string | null>(null)

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/scheduling/links')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch scheduling links')
      }

      setLinks(data.links || [])
    } catch (error) {
      console.error('Error fetching scheduling links:', error)
      toast.error('Failed to load scheduling links')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const copyLink = (slug: string) => {
    const baseUrl = window.location.origin
    const fullUrl = `${baseUrl}/schedule/${slug}`
    navigator.clipboard.writeText(fullUrl)
    toast.success('Link copied to clipboard')
  }

  const toggleLinkActive = async (link: SchedulingLink) => {
    setUpdatingLinkId(link.id)
    
    try {
      const response = await fetch(`/api/scheduling/links/${link.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: link.name,
          slug: link.slug,
          isActive: !link.isActive,
          duration: link.duration,
          maxDaysInAdvance: link.maxDaysInAdvance,
          usageLimit: link.usageLimit,
          expirationDate: link.expirationDate,
          questions: link.questions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update scheduling link')
      }

      // Update the local state
      setLinks(prevLinks => 
        prevLinks.map(l => 
          l.id === link.id 
            ? { ...l, isActive: !l.isActive } 
            : l
        )
      )
      
      toast.success(`${link.name} ${!link.isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Error updating link:', error)
      toast.error('Failed to update link status')
    } finally {
      setUpdatingLinkId(null)
    }
  }

  const deleteLink = async () => {
    if (!deleteLinkId) return
    
    try {
      const response = await fetch(`/api/scheduling/links/${deleteLinkId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete scheduling link')
      }

      // Remove from local state
      setLinks(prevLinks => prevLinks.filter(l => l.id !== deleteLinkId))
      toast.success('Scheduling link deleted')
    } catch (error) {
      console.error('Error deleting link:', error)
      toast.error('Failed to delete link')
    } finally {
      setDeleteLinkId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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
    <>
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
                  {link._count?.meetings ? ` • ${link._count.meetings} meetings` : ''}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={link.isActive} 
                  disabled={updatingLinkId === link.id}
                  onCheckedChange={() => toggleLinkActive(link)} 
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => copyLink(link.slug)}
                  disabled={updatingLinkId === link.id}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Link href={`/schedule/${link.slug}`} target="_blank">
                  <Button variant="ghost" size="icon" disabled={updatingLinkId === link.id}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/dashboard/links/${link.id}/edit`}>
                  <Button variant="ghost" size="icon" disabled={updatingLinkId === link.id}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setDeleteLinkId(link.id)}
                  disabled={updatingLinkId === link.id}
                >
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

      <AlertDialog open={!!deleteLinkId} onOpenChange={(open) => !open && setDeleteLinkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. If this link has existing meetings, it will be deactivated instead of deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteLink} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
