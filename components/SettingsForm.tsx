"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { AlertCircle, User, MessageCircle, Target } from "lucide-react";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import { settingsSchema, type SettingsFormData } from "@/schemas/settingsSchema";
import { PRODUCTIVITY_GOALS } from "@/schemas/onboardingSchema";

const COMMON_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Russian",
  "Hindi",
];

type Props = {
  user: {
    fullName: string | null;
    timezone: string;
    language: string;
    profilePictureUrl?: string | null;
    productivityGoal?: string | null;
  };
};

export default function SettingsForm({ user }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: user.fullName || "",
      timezone: user.timezone || "",
      language: user.language || "English",
      profilePictureUrl: user.profilePictureUrl || "",
      productivityGoal: (user.productivityGoal as SettingsFormData["productivityGoal"]) || undefined,
    },
  });

  const languageValue = watch("language");
  const productivityGoalValue = watch("productivityGoal");

  const onSubmit = async (data: SettingsFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      setSuccess(true);
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("Failed to update settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl border border-default-200 bg-default-50 shadow-xl">
      <CardHeader className="flex flex-col gap-1 items-center pb-2">
        <h1 className="text-2xl font-bold text-default-900">Settings</h1>
      </CardHeader>

      <Divider />

      <CardBody className="py-6">
        {error && (
          <div className="bg-danger-50 text-danger-700 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-success-50 text-success-700 p-4 rounded-lg mb-6">
            Settings updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-default-900">
              Full Name
            </label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              startContent={<User className="h-4 w-4 text-default-500" />}
              isInvalid={!!errors.fullName}
              errorMessage={errors.fullName?.message}
              {...register("fullName")}
              className="w-full"
            />
          </div>

          <TimezoneSelect
            value={watch("timezone")}
            onChange={(value) => setValue("timezone", value)}
            isInvalid={!!errors.timezone}
            errorMessage={errors.timezone?.message}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-default-900">
              Preferred Language
            </label>
            <Select
              placeholder="Select your language"
              selectedKeys={languageValue ? [languageValue] : []}
              onSelectionChange={(keys) => {
                const selected = [...keys][0] as string;
                setValue("language", selected);
              }}
              isInvalid={!!errors.language}
              errorMessage={errors.language?.message}
              startContent={<MessageCircle className="h-4 w-4 text-default-500" />}
              className="w-full"
            >
              {COMMON_LANGUAGES.map((lang) => (
                <SelectItem key={lang}>{lang}</SelectItem>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-default-900">
              What's your main productivity goal?
            </label>
            <Select
              placeholder="Select your primary goal"
              selectedKeys={productivityGoalValue ? [productivityGoalValue] : []}
              onSelectionChange={(keys) => {
                const selected = [...keys][0] as typeof PRODUCTIVITY_GOALS[number];
                setValue("productivityGoal", selected);
              }}
              isInvalid={!!errors.productivityGoal}
              errorMessage={errors.productivityGoal?.message}
              startContent={<Target className="h-4 w-4 text-default-500" />}
              className="w-full"
              description="Optional: Help us personalize your experience"
            >
              {PRODUCTIVITY_GOALS.map((goal) => (
                <SelectItem key={goal}>{goal}</SelectItem>
              ))}
            </Select>
          </div>

          <Button
            type="submit"
            color="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
