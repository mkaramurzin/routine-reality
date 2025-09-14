import * as z from "zod";
import { PRODUCTIVITY_GOALS } from "./onboardingSchema";

export const settingsSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: "Full name is required" })
    .max(100, { message: "Full name must be less than 100 characters" }),
  timezone: z.string().min(1, { message: "Timezone is required" }),
  language: z.string().min(1, { message: "Language is required" }),
  profilePictureUrl: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
  productivityGoal: z.enum(PRODUCTIVITY_GOALS).optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
