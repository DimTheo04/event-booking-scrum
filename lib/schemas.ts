import { z } from "zod";

function isFutureDateTime(value: string) {
  const eventTime = Date.parse(value);
  return !Number.isNaN(eventTime) && eventTime > Date.now();
}

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
  description: z.string().min(10, { message: "Description must be at least 10 characters long." }),
  location: z.string().min(3, { message: "Location is required." }),
  category: z.string().min(1, { message: "Please select a category." }),
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date and time." }).refine(isFutureDateTime, {
    message: "Event date and time must be in the future.",
  }),
  price: z.coerce.number().min(0, { message: "Price cannot be negative." }),
  capacity: z.coerce.number().int().positive().optional().or(z.literal(0)).or(z.nan()).transform(val => Number.isNaN(val) || val === 0 ? undefined : val),
});

export type EventCreationFormValues = z.infer<typeof eventCreationSchema>;

const dateFilterSchema = z
  .string()
  .trim()
  .regex(/^$|^\d{4}-\d{2}-\d{2}$/, {
    message: "Please enter a valid date.",
  });

export const eventDiscoveryFilterSchema = z.object({
  search: z.string().trim().max(100).default(""),
  category: z.string().trim().max(80).default("all"),
  startDate: dateFilterSchema.default(""),
  endDate: dateFilterSchema.default(""),
});

export type EventDiscoveryFilterValues = z.infer<
  typeof eventDiscoveryFilterSchema
>;

const firestoreDocumentIdSchema = z
  .string()
  .trim()
  .min(1, { message: "Missing document id." })
  .max(256, { message: "Document id is too long." })
  .refine((value) => !value.includes("/"), {
    message: "Document id cannot contain path separators.",
  });

export const rsvpActionSchema = z.object({
  eventId: firestoreDocumentIdSchema,
  userId: firestoreDocumentIdSchema,
});

export const rsvpLookupSchema = z.object({
  eventIds: z.array(firestoreDocumentIdSchema).max(100),
  userId: firestoreDocumentIdSchema,
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3, { message: "Title must be at least 3 characters long." }),
  message: z.string().trim().min(10, { message: "Message must be at least 10 characters long." }),
  targetAudience: z.enum(["all", "organizer", "attendee"]).default("all"),
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export const roleUpdateSchema = z.object({
  role: z.enum(["attendee", "organizer", "admin"]),
});
