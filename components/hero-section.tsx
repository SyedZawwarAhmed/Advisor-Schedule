import { Button } from "@/components/ui/button"
import { LoginButton } from "@/components/login-button"

export function HeroSection() {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Streamline Your Client Meetings
              </h1>
              <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Connect your calendars, integrate with Hubspot, and create personalized scheduling links that work for
                you and your clients.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <LoginButton size="lg" />
              <Button size="lg" variant="outline">
                Learn more
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img
              alt="Calendar scheduling interface"
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
              src="/placeholder.svg?height=550&width=800"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
