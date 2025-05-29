"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Trophy, ArrowRight, CheckCircle } from "lucide-react";
import { Spinner } from "@heroui/spinner";

interface RoutineProgress {
  id: string;
  title: string;
  currentStage: number;
  totalStages: number;
  currentStageProgress: number;
  currentStageThreshold: number;
  canAdvance: boolean;
  isOnFinalStage: boolean;
  status: "active" | "paused" | "finished" | "abandoned";
  overallProgressPercentage: number;
  stageProgressPercentage: number;
  tasksNeededToAdvance: number;
}

interface StageProgressionPanelProps {
  routineId: string;
  onStageAdvancement: (routineId: string) => Promise<void>;
  refreshTrigger?: number; // Trigger to refresh progress data
}

const StageProgressionPanel: React.FC<StageProgressionPanelProps> = ({
  routineId,
  onStageAdvancement,
  refreshTrigger,
}) => {
  const [progress, setProgress] = useState<RoutineProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch progress data
  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/routines/${routineId}/progress`);
      if (!response.ok) {
        throw new Error(`Error fetching progress: ${response.statusText}`);
      }
      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error("Error fetching routine progress:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProgress();
  }, [routineId]);

  // Refresh progress when tasks change (called from parent)
  useEffect(() => {
    if (refreshTrigger) {
      fetchProgress();
    }
  }, [refreshTrigger]);

  const handleAdvancement = async () => {
    if (!progress?.canAdvance || isAdvancing || progress.status === "finished") return;

    setIsAdvancing(true);
    try {
      await onStageAdvancement(routineId);
      
      // Refresh progress data after advancement
      await fetchProgress();
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error advancing stage:", error);
    } finally {
      setIsAdvancing(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full border border-default-200 bg-gradient-to-br from-primary-50 to-secondary-50 shadow-md">
        <CardBody className="flex items-center justify-center py-8">
          <Spinner size="md" />
          <p className="mt-2 text-default-600">Loading progress...</p>
        </CardBody>
      </Card>
    );
  }

  if (!progress) {
    return null;
  }

  // Don't render if routine is abandoned or paused
  if (progress.status === "abandoned" || progress.status === "paused") {
    return null;
  }

  const isFinished = progress.status === "finished";

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
              You've successfully completed all {progress.totalStages} stages of "{progress.title}"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stage indicator */}
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                Stage {progress.currentStage} of {progress.totalStages}
              </p>
              <p className="text-default-600 mt-1">
                {progress.canAdvance 
                  ? "You've unlocked the next stage!" 
                  : `Complete ${progress.tasksNeededToAdvance} more task${progress.tasksNeededToAdvance !== 1 ? 's' : ''} to advance`
                }
              </p>
            </div>

            {/* Current stage progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-default-600">
                <span>Current Stage Progress</span>
                <span>{progress.currentStageProgress} / {progress.currentStageThreshold} tasks</span>
              </div>
              <Progress 
                value={progress.stageProgressPercentage} 
                color="primary" 
                className="w-full"
                size="md"
              />
            </div>

            {/* Overall routine progress */}
            {/* <div className="space-y-2">
              <div className="flex justify-between text-sm text-default-600">
                <span>Overall Progress</span>
                <span>{Math.round(progress.overallProgressPercentage)}%</span>
              </div>
              <Progress 
                value={progress.overallProgressPercentage} 
                color="secondary" 
                className="w-full"
                size="sm"
              />
            </div> */}

            {/* Stage advancement button */}
            <div className="flex justify-center pt-2">
              <Button
                color={progress.isOnFinalStage ? "success" : "primary"}
                variant="solid"
                size="lg"
                onClick={progress.canAdvance ? handleAdvancement : undefined}
                isLoading={isAdvancing}
                endContent={
                  progress.isOnFinalStage ? (
                    <Trophy className="h-5 w-5" />
                  ) : (
                    <ArrowRight className="h-5 w-5" />
                  )
                }
                className={`font-medium px-8 ${!progress.canAdvance ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!progress.canAdvance}
              >
                {isAdvancing
                  ? "Advancing..."
                  : progress.isOnFinalStage
                  ? "Finish Routine"
                  : "Go to Next Stage"
                }
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default StageProgressionPanel; 