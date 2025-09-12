"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { z } from "zod";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import { changePasswordSchema } from "@/schemas/changePasswordSchema";

export default function ChangePasswordForm() {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    if (!user) return;

    setIsSubmitting(true);
    setAuthError(null);
    setSuccess(false);

    try {
      await user.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      reset();
    } catch (error: any) {
      console.error("Password change error:", error);
      setAuthError(
        error.errors?.[0]?.message ||
          "An error occurred during password update. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border border-default-200 bg-default-50 shadow-xl">
      <CardHeader className="flex flex-col gap-1 items-center pb-2">
        <h1 className="text-2xl font-bold text-default-900">
          Change Password
        </h1>
      </CardHeader>

      <Divider />

      <CardBody className="py-6">
        {authError && (
          <div className="bg-danger-50 text-danger-700 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{authError}</p>
          </div>
        )}

        {success && (
          <div className="bg-success-50 text-success-700 p-4 rounded-lg mb-6">
            Password updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="currentPassword"
              className="text-sm font-medium text-default-900"
            >
              Current Password
            </label>
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              placeholder="••••••••"
              startContent={<Lock className="h-4 w-4 text-default-500" />}
              endContent={
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  type="button"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-default-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-default-500" />
                  )}
                </Button>
              }
              isInvalid={!!errors.currentPassword}
              errorMessage={errors.currentPassword?.message}
              {...register("currentPassword")}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="newPassword"
              className="text-sm font-medium text-default-900"
            >
              New Password
            </label>
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="••••••••"
              startContent={<Lock className="h-4 w-4 text-default-500" />}
              endContent={
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  type="button"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-default-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-default-500" />
                  )}
                </Button>
              }
              isInvalid={!!errors.newPassword}
              errorMessage={errors.newPassword?.message}
              {...register("newPassword")}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-default-900"
            >
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              startContent={<Lock className="h-4 w-4 text-default-500" />}
              endContent={
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  type="button"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-default-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-default-500" />
                  )}
                </Button>
              }
              isInvalid={!!errors.confirmPassword}
              errorMessage={errors.confirmPassword?.message}
              {...register("confirmPassword")}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            color="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
