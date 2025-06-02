"use client";

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Eye, SkipForward, Trophy, Play, X, RotateCcw, Trash2, CheckCircle, Shield } from "lucide-react";

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
  onCommit?: () => void;
  onCompleted?: () => void;
  isCommitted?: boolean;
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
  onCommit,
  onCompleted,
  isCommitted = false,
}) => {
  const [isCompletingAll, setIsCompletingAll] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  if (!routine) return null;

  const isPaused = routine.status === "paused";
  const isFinished = routine.status === "finished";
  const isAbandoned = routine.status === "abandoned";
  const isActive = routine.status === "active";

  const handleCompleteAll = async () => {
    if (!routine || !onCompleted) return;
    
    setIsCompletingAll(true);
    try {
      await onCompleted();
      onClose();
    } catch (error) {
      console.error("Error completing all tasks:", error);
    } finally {
      setIsCompletingAll(false);
    }
  };

  const handleCommit = async () => {
    if (!routine || !onCommit) return;
    
    setIsCommitting(true);
    try {
      await onCommit();
      onClose();
    } catch (error) {
      console.error("Error committing to routine:", error);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-center">{routine.title}</h3>
        </ModalHeader>
        
        {isActive ? (
          <ModalBody className="py-8">
            {/* 2x2 Grid of buttons for active routines */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <Button 
                color="primary" 
                variant="solid"
                size="lg"
                className="h-16 flex flex-col gap-1"
                startContent={<Eye className="h-5 w-5" />}
                onPress={onViewDetails}
              >
                <span className="font-medium">View Details</span>
                <span className="text-xs opacity-80">See progress</span>
              </Button>
              
              <Button 
                color="warning" 
                variant="solid"
                size="lg"
                className="h-16 flex flex-col gap-1"
                startContent={<SkipForward className="h-5 w-5" />}
                onPress={onSkipToday}
                isDisabled={isCommitted}
              >
                <span className="font-medium">Skip Today</span>
                <span className="text-xs opacity-80">{isCommitted ? 'Committed - locked' : 'Skip all tasks'}</span>
              </Button>
              
              <Button 
                color="secondary" 
                variant="solid"
                size="lg"
                className="h-16 flex flex-col gap-1"
                startContent={<Shield className="h-5 w-5" />}
                onPress={handleCommit}
                isLoading={isCommitting}
              >
                <span className="font-medium">Commit</span>
                <span className="text-xs opacity-80">Lock in today</span>
              </Button>
              
              <Button 
                color="success" 
                variant="solid"
                size="lg"
                className="h-16 flex flex-col gap-1"
                startContent={<CheckCircle className="h-5 w-5" />}
                onPress={handleCompleteAll}
                isLoading={isCompletingAll}
              >
                <span className="font-medium">Completed</span>
                <span className="text-xs opacity-80">Mark all done</span>
              </Button>
            </div>
          </ModalBody>
        ) : (
          <>
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
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default RoutineActionsModal; 