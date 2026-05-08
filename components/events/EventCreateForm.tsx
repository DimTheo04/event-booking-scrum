"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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

export default function EventCreateForm({ organizerId }: { organizerId: string }) {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<EventCreationFormValues>({
    resolver: zodResolver(eventCreationSchema),
    defaultValues: {
      title: "",
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
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-brand-dark">Create New Event</h2>
        <p className="text-slate-500 mt-1">Fill out the details to submit a new event for admin approval.</p>
      </div>

      {isSuccess && (
        <div className="mb-6 p-4 bg-brand-light/10 border border-brand-light text-brand-dark rounded-md font-medium">
          Event successfully created! It is now pending admin approval. Redirecting...
        </div>
      )}

      {form.formState.errors.root && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm font-medium">
          {form.formState.errors.root.message}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Summer Music Festival" {...field} />
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
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                      <Input type="datetime-local" className="pl-10 w-full" {...field} />
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
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Central Park, NY" {...field} />
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
                  <FormLabel>Price (€)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
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
                  <FormLabel>Capacity (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Leave blank for unlimited"
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
              className="bg-brand-orange hover:opacity-90 text-white w-full sm:w-auto"
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
