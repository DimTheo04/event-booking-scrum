"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { signUpSchema, type SignUpFormValues } from "@/lib/schemas";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      role: "attendee",
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    setError(null);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      // 2. Send email verification
      await sendEmailVerification(user);

      // 3. Save user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: values.email,
        displayName: values.displayName,
        role: values.role,
        createdAt: serverTimestamp(),
      });

      await signOut(auth);
      setSuccess(true);
    } catch (err: unknown) {
      const errorCode = err instanceof FirebaseError ? err.code : "";
      // Simplify Firebase error messages or show as-is
      if (errorCode === "auth/email-already-in-use") {
        setError("This email is already in use.");
      } else {
        console.error("Signup error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred during sign up."
        );
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-dark md:bg-gray-50 flex-col md:flex-row">
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="verification-required-title"
            aria-describedby="verification-required-description"
            className="w-full max-w-md rounded-3xl border border-white/10 md:border-slate-200 bg-brand-dark md:bg-white p-8 text-center shadow-2xl"
          >
            <h2
              id="verification-required-title"
              className="text-2xl font-black text-white md:text-brand-dark"
            >
              Verify your email
            </h2>
            <p
              id="verification-required-description"
              className="mt-4 text-brand-light md:text-slate-600 font-medium"
            >
              We&apos;ve sent a verification link to your inbox. Please confirm your email to continue.
            </p>
            <Button onClick={() => router.push("/login")} className="mt-8 w-full h-12 bg-brand-orange hover:bg-brand-orange/90 font-bold">
              Return to Login
            </Button>
          </div>
        </div>
      )}

      {/* Brand Panel - Hidden on mobile, visible on desktop */}
      <div className="hidden md:flex md:w-1/2 bg-brand-dark flex-col justify-center p-12 text-white">
        <div className="max-w-lg mx-auto">
          <div className="mb-8">
            <Link href="/">
              <h3 className="text-3xl font-black tracking-tight text-white">
                GoOut<span className="text-brand-orange">Js</span>
              </h3>
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight">Join Us <br /> Today.</h1>
          <p className="text-lg text-brand-light leading-relaxed font-medium opacity-90">
            Create an account to RSVP for events, follow your favorite organizers, and never miss out on what matters.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 md:p-10 md:bg-white md:rounded-3xl md:shadow-xl md:border md:border-slate-100 my-8">
          <div className="space-y-2">
            <div className="mb-6 md:hidden">
              <Link href="/">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  GoOut<span className="text-brand-orange">Js</span>
                </h3>
              </Link>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white md:text-brand-dark tracking-tight">
              Create Account
            </h2>
            <p className="text-brand-light md:text-slate-500 font-medium">
              Join our community of event enthusiasts.
            </p>
          </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80 md:text-slate-700 font-bold uppercase tracking-wider text-[10px]">Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe" 
                      className="h-12 bg-white/5 md:bg-white border-white/10 md:border-slate-200 text-white md:text-brand-dark placeholder:text-white/20 md:placeholder:text-slate-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80 md:text-slate-700 font-bold uppercase tracking-wider text-[10px]">Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      className="h-12 bg-white/5 md:bg-white border-white/10 md:border-slate-200 text-white md:text-brand-dark placeholder:text-white/20 md:placeholder:text-slate-400"
                      {...field} 
                    />
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
                  <FormLabel className="text-white/80 md:text-slate-700 font-bold uppercase tracking-wider text-[10px]">Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="********" 
                      className="h-12 bg-white/5 md:bg-white border-white/10 md:border-slate-200 text-white md:text-brand-dark placeholder:text-white/20 md:placeholder:text-slate-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80 md:text-slate-700 font-bold uppercase tracking-wider text-[10px]">I am a...</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white/5 md:bg-white border-white/10 md:border-slate-200 text-white md:text-brand-dark">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-brand-dark md:bg-white border-white/10 md:border-slate-200 text-white md:text-brand-dark">
                      <SelectItem value="attendee">Attendee</SelectItem>
                      <SelectItem value="organizer">Organizer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-bold bg-brand-orange hover:bg-brand-orange/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-orange/20" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </Form>

        <div className="space-y-6 pt-4 text-center">
          <p className="text-sm text-brand-light md:text-slate-500 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-orange font-bold hover:underline underline-offset-4">
              Log in
            </Link>
          </p>
          
          <div className="flex items-center justify-center gap-2">
            <div className="h-[1px] w-8 bg-white/10 md:bg-slate-200" />
            <Link
              href="/events"
              className="text-xs font-bold text-white md:text-slate-400 hover:text-brand-orange transition-colors uppercase tracking-widest"
            >
              Continue as guest
            </Link>
            <div className="h-[1px] w-8 bg-white/10 md:bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
