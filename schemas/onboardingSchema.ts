import * as z from "zod";

export const PRODUCTIVITY_GOALS = [
  "Build consistent daily habits",
  "Improve work-life balance", 
  "Increase focus and concentration",
  "Develop a morning routine",
  "Create evening wind-down habits",
  "Boost productivity and efficiency",
  "Establish healthy lifestyle patterns",
  "Reduce stress and anxiety",
  "Improve time management",
  "Build discipline and willpower",
  "Create structure in my day",
  "Develop mindfulness practices",
  "Other"
] as const;

export const onboardingSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: "Full name is required" })
    .max(100, { message: "Full name must be less than 100 characters" }),
  timezone: z
    .string()
    .min(1, { message: "Timezone is required" }),
  language: z
    .string()
    .min(1, { message: "Language is required" }),
  profilePictureUrl: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
  productivityGoal: z
    .enum(PRODUCTIVITY_GOALS)
    .optional(),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>; 