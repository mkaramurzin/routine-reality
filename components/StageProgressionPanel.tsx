"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Trophy, ArrowRight, CheckCircle } from "lucide-react";

interface Routine {
  id: string;
  title: string;
  stages: number;
  currentStage: number;
  status: "active" | "paused" | "finished" | "abandoned";
}

interface StageProgressionPanelProps {
  routine: Routine;
  onStageAdvancement: (routineId: string) => Promise<void>;
  canAdvance?: boolean; // Optional prop to control when advancement is allowed
}

const StageProgressionPanel: React.FC<StageProgressionPanelProps> = ({
  routine,
  onStageAdvancement,
  canAdvance = true,
}) => {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isFinished = routine.status === "finished";
  const isOnFinalStage = routine.currentStage >= routine.stages - 1;
  const progressPercentage = ((routine.currentStage - 1) / (routine.stages - 1)) * 100;

  const handleAdvancement = async () => {
    if (!canAdvance || isAdvancing || isFinished) return;

    setIsAdvancing(true);
    try {
      await onStageAdvancement(routine.id);
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error advancing stage:", error);
      // You could add error toast here
    } finally {
      setIsAdvancing(false);
    }
  };

  // Don't render if routine is abandoned or paused
  if (routine.status === "abandoned" || routine.status === "paused") {
    return null;
  }

  return (
    <Card className="w-full border border-default-200 bg-gradient-to-br from-primary-50 to-secondary-50 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {isFinished ? (
            <Trophy className="h-6 w-6 text-amber-500" />
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-primary-400 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            </div>
          )}
          <h3 className="text-lg font-semibold text-default-900">
            {isFinished ? "Routine Complete!" : "Stage Progress"}
          </h3>
        </div>
        
        {showSuccess && (
          <div className="flex items-center gap-2 text-success-600 animate-pulse">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Advanced!</span>
          </div>
        )}
      </CardHeader>

      <CardBody className="pt-2">
        {isFinished ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-white" />
              </div>
            </div>
            <p className="text-lg font-medium text-default-900 mb-2">
              Congratulations! 🎉
            </p>
            <p className="text-default-600">
              You've successfully completed all {routine.stages} stages of "{routine.title}"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stage indicator */}
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                Stage {routine.currentStage} of {routine.stages}
              </p>
              <p className="text-default-600 mt-1">
                {canAdvance ? "You've unlocked the next stage!" : "Complete your current tasks to advance"}
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-default-600">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress 
                value={progressPercentage} 
                color="primary" 
                className="w-full"
                size="md"
              />
            </div>

            {/* Stage advancement button */}
            {canAdvance && (
              <div className="flex justify-center pt-2">
                <Button
                  color={isOnFinalStage ? "success" : "primary"}
                  variant="solid"
                  size="lg"
                  onClick={handleAdvancement}
                  isLoading={isAdvancing}
                  endContent={
                    isOnFinalStage ? (
                      <Trophy className="h-5 w-5" />
                    ) : (
                      <ArrowRight className="h-5 w-5" />
                    )
                  }
                  className="font-medium px-8"
                >
                  {isAdvancing
                    ? "Advancing..."
                    : isOnFinalStage
                    ? "Finish Routine"
                    : "Go to Next Stage"
                  }
                </Button>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default StageProgressionPanel; 