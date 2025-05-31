"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import { Checkbox } from "@heroui/checkbox";
import { ArrowRight, Trophy, Calendar, Target, EyeOff } from "lucide-react";
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
  const [hiddenRoutines, setHiddenRoutines] = useState<Set<string>>(new Set());
  const [showHiddenRoutines, setShowHiddenRoutines] = useState(false);
  
  // Modal states
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // Load hidden routines from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('hiddenRoutines');
    if (savedHidden) {
      try {
        const hiddenIds = JSON.parse(savedHidden);
        setHiddenRoutines(new Set(hiddenIds));
      } catch (err) {
        console.error('Error loading hidden routines:', err);
      }
    }
  }, []);

  // Save hidden routines to localStorage
  const saveHiddenRoutines = (hiddenSet: Set<string>) => {
    localStorage.setItem('hiddenRoutines', JSON.stringify(Array.from(hiddenSet)));
  };

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
    // Allow interaction with paused and abandoned routines for management actions
    if (routine.status === "paused" || routine.status === "abandoned" || routine.hasTasksToday) {
      setSelectedRoutine(routine);
      setIsActionsModalOpen(true);
      return;
    }
    
    // Don't allow interaction if routine has no tasks today and is not paused/abandoned
    if (!routine.hasTasksToday) return;
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

  const handleResume = async () => {
    if (!selectedRoutine) return;
    
    try {
      const response = await fetch(`/api/routines/${selectedRoutine.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "active",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resume routine");
      }

      // Trigger task serving for today
      try {
        await fetch(`/api/routines/${selectedRoutine.id}/serve-tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (taskError) {
        console.warn("Failed to serve tasks after resume:", taskError);
      }

      addToast({
        title: "Routine Resumed",
        description: "Today's tasks have been served. Navigating to routine page.",
        color: "success",
      });

      setIsActionsModalOpen(false);
      setSelectedRoutine(null);
      
      // Navigate to routine page and refresh
      router.push(`/routines/${selectedRoutine.id}`);
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to resume routine",
        color: "danger",
      });
    }
  };

  const handleAbandon = async () => {
    if (!selectedRoutine) return;
    
    try {
      const response = await fetch(`/api/routines/${selectedRoutine.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "abandoned",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to abandon routine");
      }

      addToast({
        title: "Routine Abandoned",
        description: "You can resume or restart at any time.",
        color: "success",
      });

      setIsActionsModalOpen(false);
      setSelectedRoutine(null);
      
      // Refresh the routines list
      await fetchRoutines();
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to abandon routine",
        color: "danger",
      });
    }
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

  const handleReset = async () => {
    if (!selectedRoutine) return;
    
    try {
      const response = await fetch(`/api/routines/${selectedRoutine.id}/reset`, {
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
        description: `Routine reset to Stage 1. ${result.tasksCreated} new tasks created.`,
        color: "success",
      });

      setIsActionsModalOpen(false);
      setSelectedRoutine(null);
      
      // Refresh the routines list
      await fetchRoutines();
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to reset routine",
        color: "danger",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedRoutine) return;
    
    try {
      const response = await fetch(`/api/routines/${selectedRoutine.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete routine");
      }

      addToast({
        title: "Routine Deleted",
        description: `"${selectedRoutine.title}" has been permanently deleted.`,
        color: "success",
      });

      setIsActionsModalOpen(false);
      setSelectedRoutine(null);
      
      // Refresh the routines list
      await fetchRoutines();
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to delete routine",
        color: "danger",
      });
    }
  };

  const closeModals = () => {
    setIsActionsModalOpen(false);
    setIsSkipModalOpen(false);
    setSelectedRoutine(null);
  };

  const isRoutineDisabled = (routine: Routine) => {
    // Paused and abandoned routines are clickable for management actions
    if (routine.status === "paused" || routine.status === "abandoned") return false;
    // Active routines with no tasks today are disabled
    return routine.status === "active" && !routine.hasTasksToday;
  };

  const handleToggleHidden = (routineId: string, isHidden: boolean) => {
    const newHiddenRoutines = new Set(hiddenRoutines);
    
    if (isHidden) {
      newHiddenRoutines.add(routineId);
    } else {
      newHiddenRoutines.delete(routineId);
    }
    
    setHiddenRoutines(newHiddenRoutines);
    saveHiddenRoutines(newHiddenRoutines);
  };

  // Filter routines to exclude hidden ones
  const visibleRoutines = routines.filter(routine => !hiddenRoutines.has(routine.id));
  const hiddenRoutinesList = routines.filter(routine => hiddenRoutines.has(routine.id));

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
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-default-900">Your Routines</h2>
            {hiddenRoutines.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-default-500">
                <EyeOff className="h-4 w-4" />
                <span>{hiddenRoutines.size} hidden</span>
              </div>
            )}
          </div>
          <Button color="primary" variant="flat" size="sm" onPress={() => router.push('/routines/select')}>
            Add Routine
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleRoutines.map((routine) => (
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
                  ) : routine.status === "paused" ? (
                    <div className="w-5 h-5 rounded-full border-2 border-warning-400 bg-warning-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-warning-500"></div>
                    </div>
                  ) : routine.status === "abandoned" ? (
                    <div className="w-5 h-5 rounded-full border-2 border-danger-400 bg-danger-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-danger-500"></div>
                    </div>
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
                      : routine.status === "paused"
                      ? 'text-warning-700'
                      : routine.status === "abandoned"
                      ? 'text-danger-700'
                      : 'text-default-900'
                  }`}>
                    {routine.title}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className={`text-xs font-medium ${getStatusColor(routine.status)}`}>
                    {routine.status.charAt(0).toUpperCase() + routine.status.slice(1)}
                  </p>
                  {isRoutineDisabled(routine) && routine.status === "active" && (
                    <p className="text-xs text-gray-400">No tasks today</p>
                  )}
                  {routine.status === "paused" && (
                    <p className="text-xs text-warning-600">Click to resume</p>
                  )}
                  {routine.status === "abandoned" && (
                    <p className="text-xs text-danger-600">Click to manage</p>
                  )}
                  <Checkbox
                    size="sm"
                    isSelected={hiddenRoutines.has(routine.id)}
                    onValueChange={(isSelected) => handleToggleHidden(routine.id, isSelected)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Hide routine"
                  >
                    <span className="text-xs text-default-500">Hide</span>
                  </Checkbox>
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

        {/* Hidden Routines Section */}
        {hiddenRoutinesList.length > 0 && (
          <div className="mt-8">
            <Button
              variant="flat"
              size="sm"
              startContent={<EyeOff className="h-4 w-4" />}
              onPress={() => setShowHiddenRoutines(!showHiddenRoutines)}
              className="mb-4"
            >
              {showHiddenRoutines ? 'Hide' : 'Show'} Hidden Routines ({hiddenRoutinesList.length})
            </Button>

            {showHiddenRoutines && (
              <div className="space-y-4">
                <div className="text-sm text-default-500 mb-4">
                  These routines are hidden from your main dashboard. Click "Unhide" to restore them.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hiddenRoutinesList.map((routine) => (
                    <Card
                      key={routine.id}
                      className="shadow-sm opacity-75 border-dashed"
                    >
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                          {routine.status === "finished" ? (
                            <Trophy className="h-4 w-4 text-amber-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-default-300 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-default-400"></div>
                            </div>
                          )}
                          <h3 className="font-medium truncate text-default-700 text-sm">
                            {routine.title}
                          </h3>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => handleToggleHidden(routine.id, false)}
                        >
                          Unhide
                        </Button>
                      </CardHeader>
                      <CardBody className="pt-1">
                        <p className="text-xs text-default-500 line-clamp-2 mb-2">
                          {routine.routineInfo}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-medium ${getStatusColor(routine.status)}`}>
                            {routine.status.charAt(0).toUpperCase() + routine.status.slice(1)}
                          </p>
                          <p className="text-xs text-default-400">
                            Stage {routine.currentStage}/{routine.stages}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show message when all routines are hidden */}
        {routines.length > 0 && visibleRoutines.length === 0 && (
          <div className="text-center py-12">
            <EyeOff className="h-12 w-12 text-default-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-default-900 mb-2">
              All routines are hidden
            </h3>
            <p className="text-default-600 mb-6">
              Use the "Show Hidden Routines" section below to restore visibility.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <RoutineActionsModal
        isOpen={isActionsModalOpen}
        onClose={closeModals}
        routine={selectedRoutine}
        onViewDetails={handleViewDetails}
        onSkipToday={handleSkipToday}
        onResume={handleResume}
        onAbandon={handleAbandon}
        onReset={handleReset}
        onDelete={handleDelete}
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