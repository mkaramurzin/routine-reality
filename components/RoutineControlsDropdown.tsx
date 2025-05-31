"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { MoreVertical, Pause, Play, EyeOff, X, RotateCcw, AlertTriangle } from "lucide-react";

interface Routine {
  id: string;
  title: string;
  status: "active" | "paused" | "finished" | "abandoned";
  currentStage: number;
  stages: number;
}

interface RoutineControlsDropdownProps {
  routine: Routine;
  onRoutineUpdated: () => void;
}

type ConfirmationModal = "pause" | "resume" | "quit" | "reset" | null;

const RoutineControlsDropdown: React.FC<RoutineControlsDropdownProps> = ({
  routine,
  onRoutineUpdated,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal>(null);

  // Helper function to update routine status
  const updateRoutineStatus = async (status: string, additionalData?: any) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/routines/${routine.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          ...additionalData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update routine");
      }

      onRoutineUpdated();
      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to manually trigger task serving
  const triggerTaskServing = async () => {
    try {
      const response = await fetch(`/api/routines/${routine.id}/serve-tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("Failed to trigger task serving, but routine was resumed");
      }
    } catch (error) {
      console.warn("Failed to trigger task serving:", error);
    }
  };

  const handlePause = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/routines/${routine.id}/pause`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to pause routine");
      }

      const result = await response.json();
      
      addToast({
        title: "Routine Paused",
        description: `You won't receive tasks until it's resumed. ${result.tasksDeleted} active tasks cleared.`,
        color: "success",
      });

      onRoutineUpdated();
      
      // Navigate to dashboard after pause
      router.push("/dashboard");
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to pause routine",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
    setConfirmationModal(null);
  };

  const handleResume = async () => {
    try {
      await updateRoutineStatus("active");
      // Try to trigger task serving for today
      await triggerTaskServing();
      addToast({
        title: "Routine Resumed",
        description: "Today's tasks have been served.",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to resume routine",
        color: "danger",
      });
    }
    setConfirmationModal(null);
  };

  const handleQuit = async () => {
    try {
      await updateRoutineStatus("abandoned");
      addToast({
        title: "Routine Abandoned",
        description: "You can resume or restart at any time.",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to quit routine",
        color: "danger",
      });
    }
    setConfirmationModal(null);
  };

  const handleReset = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/routines/${routine.id}/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset routine");
      }

      const result = await response.json();
      
      addToast({
        title: "Routine Reset",
        description: `Routine reset to Stage 1. ${result.tasksDeleted} old tasks cleared, ${result.tasksCreated} new tasks created.`,
        color: "success",
      });

      onRoutineUpdated();
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to reset routine",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
    setConfirmationModal(null);
  };

  const renderConfirmationModal = () => {
    if (!confirmationModal) return null;

    const modalConfig = {
      pause: {
        title: "Pause Routine",
        icon: <Pause className="h-5 w-5 text-warning-500" />,
        message: `Are you sure you want to pause "${routine.title}"?`,
        description: "This will clear all active tasks and stop the routine. You'll be returned to the dashboard.",
        confirmText: "Pause Routine",
        confirmColor: "warning" as const,
        onConfirm: handlePause,
      },
      resume: {
        title: "Resume Routine",
        icon: <Play className="h-5 w-5 text-success-500" />,
        message: `Are you sure you want to resume "${routine.title}"?`,
        description: "Today's tasks will be served immediately after resuming.",
        confirmText: "Resume Routine",
        confirmColor: "success" as const,
        onConfirm: handleResume,
      },
      quit: {
        title: "Quit Routine",
        icon: <AlertTriangle className="h-5 w-5 text-danger-500" />,
        message: `Are you sure you want to quit "${routine.title}"?`,
        description: "This will stop all future tasks. You can resume or restart at any time.",
        confirmText: "Quit Routine",
        confirmColor: "danger" as const,
        onConfirm: handleQuit,
      },
      reset: {
        title: "Reset Routine",
        icon: <RotateCcw className="h-5 w-5 text-primary-500" />,
        message: `Are you sure you want to reset "${routine.title}"?`,
        description: "This will delete current tasks, restart from Stage 1, and create new tasks. Past history will remain.",
        confirmText: "Reset Routine",
        confirmColor: "primary" as const,
        onConfirm: handleReset,
      },
    };

    const config = modalConfig[confirmationModal];

    return (
      <Modal isOpen={true} onOpenChange={() => setConfirmationModal(null)} size="sm" placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {config.icon}
                  <h2 className="text-lg font-semibold">{config.title}</h2>
                </div>
              </ModalHeader>
              <ModalBody>
                <p className="text-default-700">{config.message}</p>
                <p className="text-sm text-default-500 mt-2">{config.description}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  variant="light"
                  onPress={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  color={config.confirmColor}
                  onPress={config.onConfirm}
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : config.confirmText}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  };

  // Determine which actions are available based on routine status
  const getAvailableActions = () => {
    const actions = [];

    if (routine.status === "active") {
      actions.push(
        <DropdownItem
          key="pause"
          startContent={<Pause className="h-4 w-4" />}
          onPress={() => setConfirmationModal("pause")}
        >
          Pause Routine
        </DropdownItem>
      );
    }

    if (routine.status === "paused") {
      actions.push(
        <DropdownItem
          key="resume"
          startContent={<Play className="h-4 w-4" />}
          onPress={() => setConfirmationModal("resume")}
        >
          Resume Routine
        </DropdownItem>
      );
    }

    if (routine.status === "active" || routine.status === "paused") {
      actions.push(
        <DropdownItem
          key="quit"
          startContent={<X className="h-4 w-4" />}
          onPress={() => setConfirmationModal("quit")}
          className="text-danger"
          color="danger"
        >
          Quit Routine
        </DropdownItem>
      );
    }

    if (routine.status !== "finished") {
      actions.push(
        <DropdownItem
          key="reset"
          startContent={<RotateCcw className="h-4 w-4" />}
          onPress={() => setConfirmationModal("reset")}
        >
          Reset Routine
        </DropdownItem>
      );
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  // Don't show dropdown if no actions are available
  if (availableActions.length === 0) {
    return null;
  }

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant="flat"
            size="sm"
            isIconOnly
            aria-label="Routine actions"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Routine actions">
          {availableActions}
        </DropdownMenu>
      </Dropdown>

      {renderConfirmationModal()}
    </>
  );
};

export default RoutineControlsDropdown; 