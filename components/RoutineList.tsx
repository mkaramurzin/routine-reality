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
  refreshCompletionStatus: () => Promise<void>;
}

const RoutineList = forwardRef<RoutineListRef, RoutineListProps>(({ onRoutineSkipped }, ref) => {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenRoutines, setHiddenRoutines] = useState<Set<string>>(new Set());
  const [showHiddenRoutines, setShowHiddenRoutines] = useState(false);
  const [taskHistoryCache, setTaskHistoryCache] = useState<Record<string, any[]>>({});
  const [routineCompletionStatus, setRoutineCompletionStatus] = useState<Record<string, boolean>>({});
  
  // Modal states
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [commitStorage, setCommitStorage] = useState<Set<string>>(new Set());

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

  // Load committed routines from localStorage
  useEffect(() => {
    const savedCommitted = localStorage.getItem('committedRoutines');
    if (savedCommitted) {
      try {
        const committed = JSON.parse(savedCommitted);
        setCommitStorage(new Set(committed));
      } catch (err) {
        console.error('Error loading committed routines:', err);
      }
    }
  }, []);

  // Save committed routines to localStorage
  const saveCommittedRoutines = (committedSet: Set<string>) => {
    localStorage.setItem('committedRoutines', JSON.stringify(Array.from(committedSet)));
  };

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const data = await getUserRoutines();
      setRoutines(data);
      
      // Fetch task history for streak calculations
      await fetchTaskHistoryForRoutines(data);
      
      // Update completion status for all routines
      await updateRoutineCompletionStatus(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching routines:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch task history for calculating streaks
  const fetchTaskHistoryForRoutines = async (routinesList: Routine[]) => {
    const historyCache: Record<string, any[]> = {};
    
    for (const routine of routinesList) {
      try {
        const response = await fetch(`/api/tasks?type=history&routineId=${routine.id}`);
        if (response.ok) {
          const history = await response.json();
          // Only keep recent entries for streak calculation (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          historyCache[routine.id] = history
            .filter((task: any) => new Date(task.scheduledFor) >= thirtyDaysAgo)
            .sort((a: any, b: any) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime());
        }
      } catch (err) {
        console.error(`Error fetching history for routine ${routine.id}:`, err);
        historyCache[routine.id] = [];
      }
    }
    
    setTaskHistoryCache(historyCache);
  };

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshRoutines: fetchRoutines,
    refreshCompletionStatus: () => updateRoutineCompletionStatus(routines)
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
    if (!selectedRoutine) return;
    
    // Check if routine is committed for today
    if (isRoutineCommitted(selectedRoutine.id)) {
      addToast({
        title: "Cannot Skip",
        description: "You've committed to this routine for today. Skipping is disabled.",
        color: "warning",
      });
      return;
    }
    
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete routine");
      }

      // Remove from routines list
      setRoutines(prev => prev.filter(r => r.id !== selectedRoutine.id));
      closeModals();
      
      addToast({
        title: "Success",
        description: `"${selectedRoutine.title}" has been deleted.`,
        color: "success",
      });
    } catch (err) {
      console.error("Error deleting routine:", err);
      addToast({
        title: "Error",
        description: "Failed to delete routine. Please try again.",
        color: "danger",
      });
    }
  };

  const handleCommit = async () => {
    if (!selectedRoutine) return;

    try {
      // Add routine to committed set for today
      const today = new Date().toDateString();
      const commitKey = `${selectedRoutine.id}-${today}`;
      
      const newCommitted = new Set(commitStorage);
      newCommitted.add(commitKey);
      setCommitStorage(newCommitted);
      saveCommittedRoutines(newCommitted);
      
      addToast({
        title: "Committed",
        description: `You've committed to "${selectedRoutine.title}" for today. Skip option is now disabled.`,
        color: "success",
      });
    } catch (err) {
      console.error("Error committing to routine:", err);
      addToast({
        title: "Error",
        description: "Failed to commit to routine. Please try again.",
        color: "danger",
      });
    }
  };

  const handleCompleted = async () => {
    if (!selectedRoutine) return;

    try {
      // First, get all active tasks for this routine today
      const response = await fetch(`/api/tasks?type=active&routineId=${selectedRoutine.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const tasks = await response.json();
      
      if (tasks.length === 0) {
        addToast({
          title: "No Tasks",
          description: "No active tasks found for today.",
          color: "warning",
        });
        return;
      }

      // Complete all tasks
      const completionPromises = tasks
        .filter((task: any) => task.status === 'todo' || task.status === 'in_progress')
        .map((task: any) => 
          fetch(`/api/tasks/${task.id}?type=active`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "completed",
              completedAt: new Date().toISOString(),
            }),
          })
        );

      const results = await Promise.allSettled(completionPromises);
      
      // Count successful completions
      const completed = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (completed > 0) {
        addToast({
          title: "Tasks Completed",
          description: `${completed} task${completed === 1 ? '' : 's'} marked as complete${failed > 0 ? `. ${failed} failed to update.` : '.'}`,
          color: completed === tasks.length ? "success" : "warning",
        });

        // Refresh routines to update progress and completion status
        await fetchRoutines();
        
        // Call parent callback if provided
        if (onRoutineSkipped) {
          await onRoutineSkipped();
        }
      } else {
        throw new Error('No tasks were completed successfully');
      }
    } catch (err) {
      console.error("Error completing all tasks:", err);
      addToast({
        title: "Error",
        description: "Failed to complete all tasks. Please try again.",
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
    return routine.status === "active" && !routine.hasTasksToday;
  };

  // Check if routine is committed for today (prevent skipping)
  const isRoutineCommitted = (routineId: string) => {
    const today = new Date().toDateString();
    const commitKey = `${routineId}-${today}`;
    return commitStorage.has(commitKey);
  };

  // Check if all active tasks for routine are completed today
  const isRoutineCompleted = (routine: Routine) => {
    // Only check for active routines with tasks today
    if (routine.status !== 'active' || !routine.hasTasksToday) {
      return false;
    }

    // If no task count available, assume not completed
    if (!routine.todayTaskCount || routine.todayTaskCount === 0) {
      return false;
    }

    // Check real-time completion status from our state
    return routineCompletionStatus[routine.id] || false;
  };

  // New function to fetch and update completion status for all routines
  const updateRoutineCompletionStatus = async (routinesList: Routine[]) => {
    const statusUpdates: Record<string, boolean> = {};
    
    for (const routine of routinesList) {
      // Only check active routines that have tasks scheduled for today
      if (routine.status === 'active' && routine.hasTasksToday && routine.todayTaskCount && routine.todayTaskCount > 0) {
        try {
          const response = await fetch(`/api/tasks?type=active&routineId=${routine.id}`);
          if (response.ok) {
            const tasks = await response.json();
            // Check if all tasks are completed (routine is only complete if ALL tasks are done)
            const allCompleted = tasks.length > 0 && tasks.every((task: any) => task.status === 'completed');
            statusUpdates[routine.id] = allCompleted;
          } else {
            statusUpdates[routine.id] = false;
          }
        } catch (err) {
          console.error(`Error checking completion status for routine ${routine.id}:`, err);
          statusUpdates[routine.id] = false;
        }
      } else {
        // Routine is not active or has no tasks today - not completed
        statusUpdates[routine.id] = false;
      }
    }
    
    setRoutineCompletionStatus(statusUpdates);
  };

  const handleToggleHidden = (routineId: string, isHidden: boolean) => {
    const newHidden = new Set(hiddenRoutines);
    if (isHidden) {
      newHidden.add(routineId);
    } else {
      newHidden.delete(routineId);
    }
    setHiddenRoutines(newHidden);
    saveHiddenRoutines(newHidden);
  };

  // Filter routines to exclude hidden ones
  const visibleRoutines = routines.filter(routine => !hiddenRoutines.has(routine.id));
  const hiddenRoutinesList = routines.filter(routine => hiddenRoutines.has(routine.id));

  // Calculate tasks remaining in current stage
  const getTasksRemainingInStage = (routine: Routine) => {
    if (routine.currentStage > routine.thresholds.length) return 0;
    const currentThreshold = routine.thresholds[routine.currentStage - 1];
    return Math.max(0, currentThreshold - routine.currentStageProgress);
  };

  // Check if routine is ready for advancement
  const isReadyForAdvancement = (routine: Routine) => {
    if (routine.currentStage > routine.thresholds.length) return false;
    const currentThreshold = routine.thresholds[routine.currentStage - 1];
    return routine.currentStageProgress >= currentThreshold;
  };

  // Calculate consecutive days without missed tasks
  const calculateStreak = (routine: Routine) => {
    const history = taskHistoryCache[routine.id] || [];
    if (history.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    
    // Group tasks by date and check each day in reverse chronological order
    const dateGroups: Record<string, any[]> = {};
    history.forEach(task => {
      const date = new Date(task.scheduledFor).toDateString();
      if (!dateGroups[date]) dateGroups[date] = [];
      dateGroups[date].push(task);
    });

    // Check each day starting from yesterday
    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const dateStr = checkDate.toDateString();
      const dayTasks = dateGroups[dateStr];
      
      if (!dayTasks || dayTasks.length === 0) {
        // No tasks for this day, break streak
        break;
      }
      
      const hasMissedTask = dayTasks.some(task => task.status === 'missed');
      if (hasMissedTask) {
        // Found a missed task, break streak
        break;
      }
      
      // All tasks completed or skipped for this day
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      
      // Stop after checking 30 days
      if (streak >= 30) break;
    }

    return streak;
  };

  // Calculate days since routine was paused
  const getDaysSincePaused = (routine: Routine) => {
    if (routine.status !== 'paused') return 0;
    const pausedDate = new Date(routine.updatedAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - pausedDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Generate contextual insights for a routine
  const getRoutineInsights = (routine: Routine) => {
    const insights = [];

    if (routine.status === 'active') {
      // Started on date
      insights.push(`Started ${formatDate(routine.startDate)}`);
      
      // Tasks remaining or ready for advancement
      if (isReadyForAdvancement(routine)) {
        insights.push("Ready for advancement ✨");
      } else {
        const tasksRemaining = getTasksRemainingInStage(routine);
        if (tasksRemaining > 0) {
          insights.push(`${tasksRemaining} more task${tasksRemaining === 1 ? '' : 's'} in this stage`);
        }
      }
      
      // Streak information
      const streak = calculateStreak(routine);
      if (streak > 0) {
        insights.push(`${streak} day${streak === 1 ? '' : 's'} without a missed task`);
      }
    } else if (routine.status === 'paused') {
      const daysPaused = getDaysSincePaused(routine);
      insights.push(`Paused for ${daysPaused} day${daysPaused === 1 ? '' : 's'}`);
    } else if (routine.status === 'finished') {
      insights.push(`Completed ${formatDate(routine.endDate)}`);
    } else if (routine.status === 'abandoned') {
      insights.push(`Started ${formatDate(routine.startDate)}`);
      insights.push("Click to manage or restart");
    }

    return insights;
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
          {visibleRoutines.map((routine) => {
            const isCommitted = isRoutineCommitted(routine.id);
            const isCompleted = isRoutineCompleted(routine);
            const isDisabled = isRoutineDisabled(routine);
            
            return (
              <Card
                key={routine.id}
                className={`shadow-md transition-shadow ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-lg cursor-pointer'
                } ${
                  isCompleted
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-900/20 dark:to-green-800/20 dark:border-green-600/30'
                    : isCommitted 
                    ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 dark:border-purple-600/30' 
                    : ''
                }`}
                isPressable={!isDisabled}
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
                        isDisabled
                          ? 'border-gray-300'
                          : isCompleted
                          ? 'border-green-400 bg-green-100 dark:border-green-500 dark:bg-green-900/40'
                          : isCommitted
                          ? 'border-purple-400 bg-purple-100 dark:border-purple-500 dark:bg-purple-900/40'
                          : 'border-primary-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          isDisabled
                            ? 'bg-gray-300'
                            : isCompleted
                            ? 'bg-green-500'
                            : isCommitted
                            ? 'bg-purple-500'
                            : 'bg-primary-500'
                        }`}></div>
                      </div>
                    )}
                    <h3 className={`font-semibold truncate ${
                      isDisabled
                        ? 'text-gray-500'
                        : routine.status === "paused"
                        ? 'text-warning-700'
                        : routine.status === "abandoned"
                        ? 'text-danger-700'
                        : isCompleted
                        ? 'text-green-800 dark:text-green-200'
                        : isCommitted
                        ? 'text-purple-800 dark:text-purple-200'
                        : 'text-default-900'
                    }`}>
                      {routine.title}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-medium ${getStatusColor(routine.status)}`}>
                        {routine.status.charAt(0).toUpperCase() + routine.status.slice(1)}
                      </p>
                      {isCompleted && (
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium dark:bg-green-800/40 dark:text-green-200">
                          ✓ Completed
                        </span>
                      )}
                      {!isCompleted && isCommitted && (
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-medium dark:bg-purple-800/40 dark:text-purple-200">
                          Committed
                        </span>
                      )}
                    </div>
                    {isDisabled && routine.status === "active" && (
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
                    isDisabled
                      ? 'text-gray-500'
                      : isCompleted
                      ? 'text-green-700 dark:text-green-300'
                      : isCommitted
                      ? 'text-purple-700 dark:text-purple-300'
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
                        color={isDisabled ? "default" : isCompleted ? "success" : isCommitted ? "secondary" : "primary"}
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

                  {/* Contextual Insights */}
                  <div className="space-y-1">
                    {getRoutineInsights(routine).map((insight, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs text-default-500">
                        {index === 0 && routine.status === 'active' && (
                          <Calendar className={`h-3 w-3 ${isCompleted ? 'text-green-500' : isCommitted ? 'text-purple-500' : ''}`} />
                        )}
                        {index === 0 && routine.status === 'paused' && (
                          <div className="w-3 h-3 rounded-full border border-warning-400 bg-warning-100 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-warning-500"></div>
                          </div>
                        )}
                        {index === 0 && routine.status === 'finished' && (
                          <Trophy className="h-3 w-3 text-amber-500" />
                        )}
                        {index === 0 && routine.status === 'abandoned' && (
                          <div className="w-3 h-3 rounded-full border border-danger-400 bg-danger-100 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-danger-500"></div>
                          </div>
                        )}
                        <span className={`${insight.includes('Ready for advancement') ? 'text-success-600 font-medium' : ''} ${isCompleted && index === 0 ? 'text-green-600 dark:text-green-400' : isCommitted && index === 0 ? 'text-purple-600 dark:text-purple-400' : ''}`}>{insight}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            );
          })}
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
        onCommit={handleCommit}
        onCompleted={handleCompleted}
        isCommitted={selectedRoutine ? isRoutineCommitted(selectedRoutine.id) : false}
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