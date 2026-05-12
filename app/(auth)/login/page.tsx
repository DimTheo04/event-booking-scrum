"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signInSchema, type SignInFormValues } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInFormValues) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        // Block login if not verified
        await signOut(auth);
        form.setError("root", {
          message: "Please verify your email first.",
        });
        return;
      }

      // Success, redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Login error:", err);
      
      let errorMessage = "Invalid email or password.";
      const errorCode = err instanceof FirebaseError ? err.code : "";
      
      if (errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password" || errorCode === "auth/user-not-found") {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (errorCode === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later.";
      } else if (errorCode === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      }

      form.setError("root", {
        message: errorMessage,
      });
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
      {/* Brand Panel - Hidden on mobile, visible on desktop */}
      <div className="hidden md:flex md:w-1/2 bg-brand-dark flex-col justify-center p-12 text-white">
        <div className="max-w-lg mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Welcome Back.</h1>
          <p className="text-lg text-brand-light leading-relaxed">
            Sign in to your account to manage your events, discover new experiences, and connect with organizers.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-sm border border-slate-200">
          <div>
            <h2 className="text-center text-3xl font-bold text-brand-dark">
              Sign in to your account
            </h2>
          </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {form.formState.errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-slate-600 mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-brand-orange hover:opacity-80 transition-opacity">
            Sign up
          </Link>
        </p>
        <div className="text-center">
          <Link
            href="/events"
            className="text-sm font-medium text-brand-orange underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            Continue as guest
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}
