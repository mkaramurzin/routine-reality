"use client";

import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { AlertTriangle } from "lucide-react";

interface SkipConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineTitle: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

const SkipConfirmationModal: React.FC<SkipConfirmationModalProps> = ({
  isOpen,
  onClose,
  routineTitle,
  onConfirm,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="sm" placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning-500" />
                <h2 className="text-lg font-semibold">Skip Routine</h2>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-default-700">
                Are you sure you want to skip all tasks from{" "}
                <span className="font-medium text-default-900">"{routineTitle}"</span>{" "}
                today?
              </p>
              <p className="text-sm text-default-500 mt-2">
                This action will mark all today's tasks as skipped and cannot be undone.
              </p>
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
                color="warning"
                onPress={onConfirm}
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Skipping..." : "Confirm Skip"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SkipConfirmationModal; 