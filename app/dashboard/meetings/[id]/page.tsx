"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Clock, Calendar, Mail, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"

type Answer = {
  id: string
  text: string
  augmentedNote: string | null
  question: {
    id: string
    text: string
  }
}

type Meeting = {
  id: string
  startTime: string
  endTime: string
  clientEmail: string
  clientLinkedIn: string | null
  status: string
  hubspotContactId: string | null
  linkedInSummary: any | null
  answers: Answer[]
  schedulingLink: {
    name: string
    duration: number
  }
}

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`/api/meetings/${params.id}`)
        const data = await response.json()
        
        if (data.error) {
          console.error('Error fetching meeting:', data.error)
          router.push('/dashboard/meetings')
          return
        }
        
        setMeeting(data.meeting)
      } catch (error) {
        console.error('Error fetching meeting:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchMeeting()
    }
  }, [params.id, router])

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/dashboard/meetings')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Meetings
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Meeting Not Found</CardTitle>
            <CardDescription>
              The meeting you are looking for does not exist or you do not have access to it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard/meetings')}>
              Return to Meetings
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/dashboard/meetings')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Meetings
        </Button>
      </div>
      
      <div className="flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-6">
        {/* Meeting Details */}
        <Card className="flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{meeting.schedulingLink.name}</CardTitle>
              <Badge 
                className={
                  meeting.status === "scheduled" 
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100" 
                    : meeting.status === "completed" 
                    ? "bg-green-100 text-green-800 hover:bg-green-100" 
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                }
              >
                {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
              </Badge>
            </div>
            <CardDescription>
              Meeting Details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {format(new Date(meeting.startTime), "PPPP")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(meeting.startTime), "p")} - {format(new Date(meeting.endTime), "p")}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{meeting.schedulingLink.duration} minutes</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start space-x-4">
                <Avatar className="h-10 w-10 mt-1">
                  <AvatarFallback>{getInitials(meeting.clientEmail)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{meeting.clientEmail}</div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    Client Email
                  </div>
                  {meeting.clientLinkedIn && (
                    <div className="mt-1">
                      <a 
                        href={meeting.clientLinkedIn} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        LinkedIn Profile
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LinkedIn Summary */}
        {meeting.linkedInSummary && (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>LinkedIn Insights</CardTitle>
              <CardDescription>
                Information extracted from client's LinkedIn profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {meeting.linkedInSummary.headline && (
                <div>
                  <div className="text-sm font-medium">Professional Headline</div>
                  <div className="text-sm">{meeting.linkedInSummary.headline}</div>
                </div>
              )}
              
              {meeting.linkedInSummary.summary && (
                <div>
                  <div className="text-sm font-medium">Summary</div>
                  <div className="text-sm">{meeting.linkedInSummary.summary}</div>
                </div>
              )}
              
              {meeting.linkedInSummary.experience && meeting.linkedInSummary.experience.length > 0 && (
                <div>
                  <div className="text-sm font-medium">Current Position</div>
                  <div className="text-sm">
                    {meeting.linkedInSummary.experience[0].title} at {meeting.linkedInSummary.experience[0].company}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Meeting Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Responses</CardTitle>
          <CardDescription>
            Responses provided by the client during scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {meeting.answers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No responses provided for this meeting
              </div>
            ) : (
              meeting.answers.map((answer) => (
                <div key={answer.id} className="space-y-2">
                  <div className="font-medium">{answer.question.text}</div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {answer.text}
                  </div>
                  
                  {answer.augmentedNote && answer.augmentedNote !== answer.text && (
                    <div className="p-3 bg-blue-50 rounded-md border-l-4 border-blue-500">
                      <div className="text-xs font-semibold text-blue-700 mb-1">Context</div>
                      <div>{answer.augmentedNote}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 