import Link from "next/link";
import { Button } from "@/components/ui/button";
import Features from "@/components/landing/features";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-5">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">Recall</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Sign Up</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <section className="w-full flex-1 flex flex-col items-center justify-center">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center justify-center flex-1 px-4 py-12">
            <h1 className="max-w-4xl text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
              Master Any Language with{" "}
              <span className="text-primary">Smart Learning</span>
            </h1>
            <p className="max-w-2xl text-lg md:text-xl text-center text-muted-foreground mt-4">
              Learn any language effectively with our intelligent spaced repetition system.
              Create personalized word lists, track your progress, and master vocabulary
              at your own pace.
            </p>
            <div className="space-x-4">
              <Link href="/auth/signup">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
        <Features />
        <section className="container space-y-6 pb-8 md:pb-12 lg:pb-24">
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <div className="space-y-2">
                  <h3 className="font-bold">Smart Spaced Repetition</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn efficiently with our proven algorithm that adapts to your learning pace.
                    Words are reviewed at optimal intervals to ensure maximum retention.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <div className="space-y-2">
                  <h3 className="font-bold">Custom Word Lists</h3>
                  <p className="text-sm text-muted-foreground">
                    Create personalized vocabulary lists, import words in bulk, and organize them
                    into sections for structured learning.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <div className="space-y-2">
                  <h3 className="font-bold">Progress Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your learning journey with detailed statistics, review history,
                    and performance metrics for each word.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <div className="space-y-2">
                  <h3 className="font-bold">Multi-Language Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn any language with support for multiple translations. Add meanings
                    in your preferred languages for better understanding.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <div className="space-y-2">
                  <h3 className="font-bold">Flexible Learning Sessions</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose your session size, focus on specific sections, and learn at your
                    own pace with customizable learning sessions.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <div className="space-y-2">
                  <h3 className="font-bold">Import & Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Easily import word lists from files or export your vocabulary for backup
                    and sharing with other learners.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t mt-auto">
        <div className="container flex items-center justify-center h-12">
            <p className="text-center text-sm leading-loose text-muted-foreground ">
              Built with ❤️ for language learners worldwide. Start your polyglot journey today!
            </p>
        </div>
      </footer>
    </div>
  );
}
