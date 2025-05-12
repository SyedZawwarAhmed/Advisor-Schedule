import { LoginButton } from "@/components/login-button"
import { Features } from "@/components/features"
import { HeroSection } from "@/components/hero-section"

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white flex justify-center items-center">
        <div className="container flex items-center justify-between h-20 py-2">
          <span className="text-xl font-semibold mb-2">AdvisorSchedule</span>
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
