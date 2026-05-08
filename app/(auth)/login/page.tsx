"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
    } catch (err: any) {
      console.error("Login error:", err);
      
      let errorMessage = "Invalid email or password.";
      
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later.";
      } else if (err.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      }

      form.setError("root", {
        message: errorMessage,
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
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
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
