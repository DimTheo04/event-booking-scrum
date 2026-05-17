import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MouseGlow } from "@/components/visuals/MouseGlow";
import { BackgroundVisuals } from "@/components/visuals/BackgroundVisuals";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="dark relative min-h-screen flex flex-col overflow-y-auto bg-brand-dark selection:bg-brand-orange/30">
      {/* Visual background layers */}
      <BackgroundVisuals />
      <MouseGlow />

      {/* Hero Section */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-40 flex flex-col md:flex-row items-center flex-1">
        <div className="w-full md:w-3/5 text-center md:text-left space-y-8">
          <div className="space-y-6">
            <div className="inline-flex items-center px-5 py-2 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-xs font-bold uppercase tracking-wider">
              <span className="font-black tracking-tight text-white normal-case text-base">
                GoOut<span className="text-brand-orange">Js</span>
              </span>
            </div>

            <h1 className="text-4xl md:text-8xl font-black text-white tracking-tight leading-[1.1] drop-shadow-sm">
              Experience <br />
              Unforgettable<br />
              Events
            </h1>

            <p className="text-lg md:text-2xl text-white font-medium max-w-xl mx-auto md:mx-0 leading-relaxed opacity-80">
              Discover, follow, and engage with the most exciting events in your community.
              The premium platform for seamless event management.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center md:justify-start items-center gap-6 pt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-56 h-14 md:h-16 text-xl font-black bg-brand-orange hover:bg-brand-orange/90 transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(215,111,48,0.3)]">
                Get Started
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-56 h-14 md:h-16 text-xl font-bold border-white/20 text-white hover:bg-white/10 transition-all">
                Sign Up
              </Button>
            </Link>
          </div>

          <div className="pt-8 md:pt-12">
            <Link
              href="/events"
              className="text-white hover:text-brand-orange transition-colors text-sm font-bold flex items-center justify-center md:justify-start gap-3 group"
            >
              <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-brand-orange transition-colors">Continue as guest</span>
              <svg className="group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative side element */}
      <div className="hidden md:block fixed top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand-orange/5 to-transparent z-0 pointer-events-none" />
      <Footer />
    </main>
  );
}

