import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
          Event Discovery & Management
        </h1>
        <p className="text-xl text-gray-600">
          Discover exciting events, follow organizers, and manage your RSVPs all in one place.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/login">
            <Button size="lg" className="w-32">
              Log In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="w-32">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
