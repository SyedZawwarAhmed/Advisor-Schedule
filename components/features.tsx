import { CalendarDays, Users, Link2, Clock, Calendar, MessageSquare } from "lucide-react"

export function Features() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Everything you need to manage your client meetings efficiently
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <CalendarDays className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Google Calendar Integration</h3>
            <p className="text-center text-gray-500">
              Connect multiple Google calendars to manage all your availability in one place
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Users className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Hubspot CRM Integration</h3>
            <p className="text-center text-gray-500">
              Automatically sync with your Hubspot contacts and enrich meeting data
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Link2 className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Custom Scheduling Links</h3>
            <p className="text-center text-gray-500">
              Create personalized booking links with usage limits and expiration dates
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Clock className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Flexible Scheduling Windows</h3>
            <p className="text-center text-gray-500">
              Define your availability with customizable time slots for each day of the week
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Calendar className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Smart Booking Interface</h3>
            <p className="text-center text-gray-500">
              Client-friendly booking experience that respects your availability
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <MessageSquare className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">AI-Enhanced Context</h3>
            <p className="text-center text-gray-500">
              Get client insights from Hubspot and LinkedIn with AI-powered summaries
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
