"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import { ArrowRight, Trophy, Calendar, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserRoutines, skipRoutineForDay } from "@/lib/api/routines";
import RoutineActionsModal from "./RoutineActionsModal";
import SkipConfirmationModal from "./SkipConfirmationModal";
import { addToast } from "@heroui/toast";

interface Routine {
  id: string;
  title: string;
  routineInfo: string;
  routineType: string;
  startDate: string;
  endDate: string;
  stages: number;
  thresholds: number[];
  currentStage: number;
  currentStageProgress: number;
  status: "active" | "paused" | "finished" | "abandoned";
  createdAt: string;
  updatedAt: string;
  todayTaskCount?: number;
  hasTasksToday?: boolean;
}

interface RoutineListProps {
  onRoutineSkipped?: () => Promise<void>;
}

export interface RoutineListRef {
  refreshRoutines: () => Promise<void>;
}

const RoutineList = forwardRef<RoutineListRef, RoutineListProps>(({ onRoutineSkipped }, ref) => {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const data = await getUserRoutines();
      setRoutines(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching routines:", err);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshRoutines: fetchRoutines
  }));

  useEffect(() => {
    fetchRoutines();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-success-600";
      case "finished":
        return "text-warning-600";
      case "paused":
        return "text-default-500";
      case "abandoned":
        return "text-danger-600";
      default:
        return "text-default-600";
    }
  };

  const getProgressPercentage = (routine: Routine) => {
    return ((routine.currentStage - 1) / (routine.stages - 1)) * 100;
  };

  const handleRoutineClick = (routine: Routine) => {
    // Don't allow interaction if routine has no tasks today
    if (!routine.hasTasksToday) return;
    
    setSelectedRoutine(routine);
    setIsActionsModalOpen(true);
  };

  const handleViewDetails = () => {
    if (selectedRoutine) {
      router.push(`/routines/${selectedRoutine.id}`);
      setIsActionsModalOpen(false);
    }
  };

  const handleSkipToday = () => {
    setIsActionsModalOpen(false);
    setIsSkipModalOpen(true);
  };

  const handleSkipConfirm = async () => {
    if (!selectedRoutine) return;
    
    try {
      setIsSkipping(true);
      const result = await skipRoutineForDay(selectedRoutine.id);
      
      addToast({
        title: "Success",
        description: `${result.skippedCount} tasks skipped successfully!`,
        color: "success",
      });
      setIsSkipModalOpen(false);
      setSelectedRoutine(null);
      
      // Trigger refresh of dashboard tasks
      if (onRoutineSkipped) {
        await onRoutineSkipped();
      }
    } catch (error) {
      console.error("Error skipping routine:", error);
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to skip routine",
        color: "danger",
      });
    } finally {
      setIsSkipping(false);
    }
  };

  const closeModals = () => {
    setIsActionsModalOpen(false);
    setIsSkipModalOpen(false);
    setSelectedRoutine(null);
  };

  const isRoutineDisabled = (routine: Routine) => {
    return routine.status === "active" && !routine.hasTasksToday;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-default-600">Loading routines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger-600 mb-4">{error}</p>
        <Button variant="flat" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (routines.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 text-default-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-default-900 mb-2">
          No routines yet
        </h3>
        <p className="text-default-600 mb-6">
          Start your wellness journey by adding your first routine.
        </p>
        <Button 
          color="primary" 
          variant="solid"
          onPress={() => router.push('/routines/select')}
        >
          Add Routine
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-default-900">Your Routines</h2>
          <Button color="primary" variant="flat" size="sm" onPress={() => router.push('/routines/select')}>
            Add Routine
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map((routine) => (
            <Card
              key={routine.id}
              className={`shadow-md transition-shadow ${
                isRoutineDisabled(routine) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-lg cursor-pointer'
              }`}
              isPressable={!isRoutineDisabled(routine)}
              onPress={() => handleRoutineClick(routine)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  {routine.status === "finished" ? (
                    <Trophy className="h-5 w-5 text-amber-500" />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isRoutineDisabled(routine)
                        ? 'border-gray-300'
                        : 'border-primary-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isRoutineDisabled(routine)
                          ? 'bg-gray-300'
                          : 'bg-primary-500'
                      }`}></div>
                    </div>
                  )}
                  <h3 className={`font-semibold truncate ${
                    isRoutineDisabled(routine)
                      ? 'text-gray-500'
                      : 'text-default-900'
                  }`}>
                    {routine.title}
                  </h3>
                </div>
                <div className="flex flex-col items-end">
                  <p className={`text-xs font-medium ${getStatusColor(routine.status)}`}>
                    {routine.status.charAt(0).toUpperCase() + routine.status.slice(1)}
                  </p>
                  {isRoutineDisabled(routine) && (
                    <p className="text-xs text-gray-400 mt-1">No tasks today</p>
                  )}
                </div>
              </CardHeader>

              <CardBody className="pt-2 space-y-4">
                <p className={`text-sm line-clamp-2 ${
                  isRoutineDisabled(routine)
                    ? 'text-gray-500'
                    : 'text-default-600'
                }`}>
                  {routine.routineInfo}
                </p>

                {/* Progress */}
                {routine.status !== "finished" ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-default-600">
                      <span>Stage {routine.currentStage} of {routine.stages}</span>
                      <span>{Math.round(getProgressPercentage(routine))}%</span>
                    </div>
                    <Progress
                      value={getProgressPercentage(routine)}
                      color={isRoutineDisabled(routine) ? "default" : "primary"}
                      size="sm"
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-sm font-medium text-amber-600">
                      🎉 Completed!
                    </span>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-default-500">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDate(routine.startDate)} - {formatDate(routine.endDate)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Modals */}
      <RoutineActionsModal
        isOpen={isActionsModalOpen}
        onClose={closeModals}
        routine={selectedRoutine}
        onViewDetails={handleViewDetails}
        onSkipToday={handleSkipToday}
      />

      <SkipConfirmationModal
        isOpen={isSkipModalOpen}
        onClose={closeModals}
        routineTitle={selectedRoutine?.title || ""}
        onConfirm={handleSkipConfirm}
        isLoading={isSkipping}
      />
    </>
  );
});

export default RoutineList; 