"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { User, Globe, MessageCircle, Camera, Target, AlertCircle } from "lucide-react";
import { onboardingSchema, type OnboardingFormData, PRODUCTIVITY_GOALS } from "@/schemas/onboardingSchema";
import { TimezoneSelect } from "@/components/TimezoneSelect";

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

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: "",
      timezone: "",
      language: "English",
      profilePictureUrl: "",
      productivityGoal: undefined,
    },
  });

  // Watch form values
  const languageValue = watch("language");
  const productivityGoalValue = watch("productivityGoal");

  // Auto-detect timezone and set smart defaults
  useEffect(() => {
    if (isLoaded && user) {
      // Set full name from Clerk
      const name = user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim();
      if (name) {
        setValue("fullName", name);
      }

      // Set profile picture from Clerk
      if (user.imageUrl) {
        setValue("profilePictureUrl", user.imageUrl);
      }
    }
  }, [isLoaded, user, setValue]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Check if user has already completed onboarding
  useEffect(() => {
    if (isLoaded && user) {
      const checkOnboardingStatus = async () => {
        try {
          const response = await fetch("/api/users/onboard");
          if (response.ok) {
            const data = await response.json();
            if (data.user && data.onboarded) {
              // User already onboarded, redirect to routine select page
              router.push("/routines/select");
            }
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
        }
      };

      checkOnboardingStatus();
    }
  }, [isLoaded, user, router]);

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/users/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      router.push("/routines/select");
    } catch (error) {
      console.error("Onboarding error:", error);
      setError("An error occurred while setting up your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    setError(null);

    try {
      const response = await fetch("/api/users/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: user?.fullName || "User",
          timezone: "UTC",
          language: "English",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to skip onboarding");
      }

      router.push("/routines/select");
    } catch (error) {
      console.error("Skip onboarding error:", error);
      setError("An error occurred while setting up your account. Please try again.");
    } finally {
      setIsSkipping(false);
    }
  };

  if (!isLoaded) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-default-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border border-default-200 bg-default-50 shadow-xl">
        <CardHeader className="flex flex-col gap-2 items-center pb-4">
          <h1 className="text-3xl font-bold text-default-900">Welcome to Routine Reality!</h1>
          <p className="text-default-600 text-center">
            Let's personalize your experience and get you started
          </p>
        </CardHeader>

        <Divider />

        <CardBody className="py-8">
          {error && (
            <div className="bg-danger-50 text-danger-700 p-4 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-default-900">
                Full Name <span className="text-danger">*</span>
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

            {/* Timezone */}
            <TimezoneSelect
              value={watch("timezone")}
              onChange={(value) => setValue("timezone", value)}
              isInvalid={!!errors.timezone}
              errorMessage={errors.timezone?.message}
            />

            {/* Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-default-900">
                Preferred Language <span className="text-danger">*</span>
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
                  <SelectItem key={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Profile Picture URL */}
            {/* <div className="space-y-2">
              <label htmlFor="profilePictureUrl" className="text-sm font-medium text-default-900">
                Profile Picture URL
              </label>
              <Input
                id="profilePictureUrl"
                type="url"
                placeholder="https://example.com/your-photo.jpg"
                startContent={<Camera className="h-4 w-4 text-default-500" />}
                isInvalid={!!errors.profilePictureUrl}
                errorMessage={errors.profilePictureUrl?.message}
                {...register("profilePictureUrl")}
                className="w-full"
                description="Optional: We'll use your account photo by default"
              />
            </div> */}

            {/* Productivity Goal */}
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
                  <SelectItem key={goal}>
                    {goal}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="submit"
                color="primary"
                className="flex-1"
                isLoading={isSubmitting}
                size="lg"
              >
                {isSubmitting ? "Setting up your account..." : "Complete Setup"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                color="default"
                className="flex-1"
                onPress={handleSkip}
                isLoading={isSkipping}
                size="lg"
              >
                {isSkipping ? "Skipping..." : "Skip and continue"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-default-500">
              You can update these preferences later in your settings
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 