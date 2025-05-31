"use client";

import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Eye, SkipForward, Trophy, Play, X, RotateCcw, Trash2 } from "lucide-react";

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
  onViewDetails?: () => void;
  onSkipToday?: () => void;
  onResume?: () => void;
  onAbandon?: () => void;
  onReset?: () => void;
  onDelete?: () => void;
}

const RoutineActionsModal: React.FC<RoutineActionsModalProps> = ({
  isOpen,
  onClose,
  routine,
  onViewDetails,
  onSkipToday,
  onResume,
  onAbandon,
  onReset,
  onDelete,
}) => {
  if (!routine) return null;

  const isPaused = routine.status === "paused";
  const isFinished = routine.status === "finished";
  const isAbandoned = routine.status === "abandoned";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">{routine.title}</h3>
          <p className="text-sm text-default-600 capitalize">
            Status: {routine.status}
          </p>
        </ModalHeader>
        <ModalBody>
          <p className="text-default-700 mb-4">{routine.routineInfo}</p>
          
          {isPaused && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mb-4">
              <p className="text-warning-800 text-sm">
                This routine is currently paused. You can resume it to continue with today's tasks or abandon it permanently.
              </p>
            </div>
          )}

          {isAbandoned && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 mb-4">
              <p className="text-danger-800 text-sm">
                This routine has been abandoned. You can reset it to start over from Stage 1, or delete it permanently.
              </p>
            </div>
          )}

          {isFinished && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-3 mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-success-600" />
              <p className="text-success-800 text-sm">
                Congratulations! You've completed this routine.
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          
          {isPaused ? (
            <>
              <Button 
                color="success" 
                startContent={<Play className="h-4 w-4" />}
                onPress={onResume}
              >
                Resume Routine
              </Button>
              <Button 
                color="danger" 
                variant="flat"
                startContent={<X className="h-4 w-4" />}
                onPress={onAbandon}
              >
                Abandon Routine
              </Button>
            </>
          ) : isAbandoned ? (
            <>
              <Button 
                color="primary" 
                startContent={<RotateCcw className="h-4 w-4" />}
                onPress={onReset}
              >
                Reset Routine
              </Button>
              <Button 
                color="danger" 
                variant="flat"
                startContent={<Trash2 className="h-4 w-4" />}
                onPress={onDelete}
              >
                Delete Routine
              </Button>
            </>
          ) : (
            <>
              <Button 
                color="primary" 
                startContent={<Eye className="h-4 w-4" />}
                onPress={onViewDetails}
              >
                View Details
              </Button>
              {!isFinished && (
                <Button 
                  color="warning" 
                  variant="flat"
                  startContent={<SkipForward className="h-4 w-4" />}
                  onPress={onSkipToday}
                >
                  Skip Today
                </Button>
              )}
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RoutineActionsModal; 