"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
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

      setSuccess(true);
    } catch (err: any) {
      console.error("Signup error:", err);
      // Simplify Firebase error messages or show as-is
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use.");
      } else {
        setError(err.message || "An error occurred during sign up.");
      }
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Please check your inbox to verify your email address. You must verify your email before you can sign in.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
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
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
