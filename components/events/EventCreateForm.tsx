"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventCreationSchema, type EventCreationFormValues } from "@/lib/schemas";
import { createEvent } from "@/lib/services/events";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";



export default function EventCreateForm({ organizerId }: { organizerId: string }) {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<EventCreationFormValues>({
    resolver: zodResolver(eventCreationSchema) as Resolver<EventCreationFormValues>,
    defaultValues: {
      title: "",
      description: "",
      location: "",
      category: "",
      dateTime: "",
      price: 0,
      capacity: undefined,
    },
  });

  async function onSubmit(values: EventCreationFormValues) {
    setIsSuccess(false);

    // In our service, we expect standard EventCreationFormValues. 
    // The schema parses dateTime as string and price/capacity as numbers.
    const res = await createEvent(values, organizerId);

    if (res.success) {
      setIsSuccess(true);
      form.reset();
      // Wait a moment so they see the success message
      setTimeout(() => {
        router.push("/dashboard/events");
      }, 1500);
    } else {
      form.setError("root", {
        message: "Failed to create event. Please try again later.",
      });
    }
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <CalendarDays className="text-brand-orange" size={24} />
        <div>
          <h2 className="text-xl font-bold text-brand-dark tracking-tight">Create New Event</h2>
          <p className="text-sm text-slate-500 mt-0.5">Submit a new event for admin approval.</p>
        </div>
      </div>

      {isSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          Event successfully created! Pending admin approval. Redirecting...
        </div>
      )}

      {form.formState.errors.root && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
          {form.formState.errors.root.message}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-sm font-semibold text-slate-700">Event Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., Summer Music Festival"
                      className="bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-sm font-semibold text-slate-700">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what the event is about..."
                      className="resize-y min-h-[100px] bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md text-sm transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md transition-colors">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Music">Music</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Tech">Tech</SelectItem>
                      <SelectItem value="Art">Art</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Date & Time</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <Input
                        type="datetime-local"
                        className="pl-9 w-full bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md transition-colors text-sm"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-sm font-semibold text-slate-700">Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., Central Park, NY"
                      className="bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Price (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Capacity (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Leave blank for unlimited"
                      className="bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md transition-colors"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              className="w-full sm:w-auto bg-brand-dark hover:bg-brand-dark/90 text-white rounded-md px-6 py-2 transition-colors"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Submitting..." : "Submit Event"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
