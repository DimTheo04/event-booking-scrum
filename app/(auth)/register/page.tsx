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
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="verification-required-title"
            aria-describedby="verification-required-description"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xl"
          >
            <h2
              id="verification-required-title"
              className="text-2xl font-bold text-brand-dark"
            >
              Verify your email first
            </h2>
            <p
              id="verification-required-description"
              className="mt-4 text-slate-600"
            >
              You need to verify your email first. Check your inbox, then log in
              after your email is confirmed.
            </p>
            <Button onClick={() => router.push("/login")} className="mt-6 w-full">
              Go to Login
            </Button>
          </div>
        </div>
      )}

      {/* Brand Panel - Hidden on mobile, visible on desktop */}
      <div className="hidden md:flex md:w-1/2 bg-brand-dark flex-col justify-center p-12 text-white">
        <div className="max-w-lg mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Join Us Today.</h1>
          <p className="text-lg text-brand-light leading-relaxed">
            Create an account to RSVP for events, follow your favorite organizers, and never miss out.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-sm border border-slate-200">
          <div>
            <h2 className="text-center text-3xl font-bold text-brand-dark">
              Create an account
            </h2>
          </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="attendee">Attendee</SelectItem>
                      <SelectItem value="organizer">Organizer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-red-500 text-sm font-medium">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing up..." : "Sign Up"}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-slate-600 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-orange hover:opacity-80 transition-opacity">
            Log in
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
