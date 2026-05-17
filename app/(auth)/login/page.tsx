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

function getPostLoginRedirectPath() {
  if (typeof window === "undefined") {
    return "/dashboard";
  }

  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/dashboard";
  }

  if (redirect === "/login" || redirect === "/register") {
    return "/dashboard";
  }

  return redirect;
}

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

      router.push(getPostLoginRedirectPath());
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
    <div className="flex min-h-screen bg-brand-dark md:bg-gray-50 flex-col md:flex-row">
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
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight">
            Welcome <br /> Back.
          </h1>
          <p className="text-lg text-brand-light leading-relaxed font-medium opacity-90">
            Sign in to your account to manage your events, discover new experiences, and connect with organizers.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-10 md:p-10 md:bg-white md:rounded-3xl md:shadow-xl md:border md:border-slate-100">
          <div className="space-y-2">
            <div className="mb-6 md:hidden">
              <Link href="/">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  GoOut<span className="text-brand-orange">Js</span>
                </h3>
              </Link>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white md:text-brand-dark tracking-tight">
              Sign In
            </h2>
            <p className="text-brand-light md:text-slate-500 font-medium">
              Enter your credentials to access your account.
            </p>
          </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {form.formState.errors.root && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-1">
                {form.formState.errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-bold bg-brand-orange hover:bg-brand-orange/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-orange/20" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>

        <div className="space-y-6 pt-4 text-center">
          <p className="text-sm text-brand-light md:text-slate-500 font-medium">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-orange font-bold hover:underline underline-offset-4">
              Create one
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
