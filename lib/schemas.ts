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
