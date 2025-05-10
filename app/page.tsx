import { LoginButton } from "@/components/login-button"
import { Features } from "@/components/features"
import { HeroSection } from "@/components/hero-section"

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-xl">AdvisorSchedule</span>
          </div>
          <nav className="flex items-center gap-4">
            <LoginButton />
          </nav>
        </div>
      </header>
      <main>
        <HeroSection />
        <Features />
      </main>
    </div>
  )
}
