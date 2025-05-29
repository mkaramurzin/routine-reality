"use client";

import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Eye, SkipForward, Trophy } from "lucide-react";

interface Routine {
  id: string;
  title: string;
  routineInfo: string;
  status: "active" | "paused" | "finished" | "abandoned";
}

interface RoutineActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: Routine | null;
  onViewDetails: () => void;
  onSkipToday: () => void;
}

const RoutineActionsModal: React.FC<RoutineActionsModalProps> = ({
  isOpen,
  onClose,
  routine,
  onViewDetails,
  onSkipToday,
}) => {
  if (!routine) return null;

  const canSkip = routine.status === "active";

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md" placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {routine.status === "finished" ? (
                  <Trophy className="h-5 w-5 text-amber-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-primary-400 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                  </div>
                )}
                <h2 className="text-lg font-semibold">{routine.title}</h2>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-default-600 text-sm">
                {routine.routineInfo}
              </p>
              <p className="text-xs text-default-500 mt-2">
                Choose an action for this routine:
              </p>
            </ModalBody>
            <ModalFooter className="flex flex-col gap-2">
              <Button
                color="primary"
                variant="solid"
                startContent={<Eye className="h-4 w-4" />}
                onPress={onViewDetails}
                className="w-full"
              >
                View Details
              </Button>
              {canSkip && (
                <Button
                  color="warning"
                  variant="flat"
                  startContent={<SkipForward className="h-4 w-4" />}
                  onPress={onSkipToday}
                  className="w-full"
                >
                  Skip Today
                </Button>
              )}
              <Button
                color="default"
                variant="light"
                onPress={onClose}
                className="w-full"
              >
                Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default RoutineActionsModal; 