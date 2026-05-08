import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters long." }),
  role: z.enum(["attendee", "organizer"]),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export const eventCreationSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long." }),
  location: z.string().min(3, { message: "Location is required." }),
  category: z.string().min(1, { message: "Please select a category." }),
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date and time." }),
  price: z.coerce.number().min(0, { message: "Price cannot be negative." }),
  capacity: z.coerce.number().int().positive().optional().or(z.literal(0)).or(z.nan()).transform(val => Number.isNaN(val) || val === 0 ? undefined : val),
});

export type EventCreationFormValues = z.infer<typeof eventCreationSchema>;
