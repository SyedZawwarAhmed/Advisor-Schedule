import { BookingForm } from "@/components/booking-form"
import { AvailableTimeSlots } from "@/components/available-time-slots"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// This would be a database lookup in a real implementation
const getSchedulingLink = (slug: string) => {
  const links = [
    {
      id: "1",
      name: "Initial Consultation",
      slug: "initial-consultation",
      duration: 30,
      maxDaysInAdvance: 30,
      questions: [
        { id: "q1", text: "What are your financial goals?" },
        { id: "q2", text: "What concerns do you have?" },
      ],
    },
    {
      id: "2",
      name: "Portfolio Review",
      slug: "portfolio-review",
      duration: 60,
      maxDaysInAdvance: 14,
      questions: [{ id: "q1", text: "What is your current portfolio allocation?" }],
    },
  ]

  return links.find((link) => link.slug === slug)
}

export default function SchedulePage({ params }: { params: { slug: string } }) {
  const link = getSchedulingLink(params.slug)

  if (!link) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link Not Found</CardTitle>
            <CardDescription>The scheduling link you're looking for doesn't exist or has been removed.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{link.name}</CardTitle>
          <CardDescription>Duration: {link.duration} minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <AvailableTimeSlots duration={link.duration} maxDaysInAdvance={link.maxDaysInAdvance} />
            <BookingForm questions={link.questions} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
