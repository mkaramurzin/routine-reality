"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import TaskCard from "./TaskCard";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed" | "missed";
  stageNumber?: number;
  isImmutable?: boolean;
  routineTitle?: string;
  routineId?: string;
}

interface DashboardTaskListProps {
  userId: string;
}

export interface DashboardTaskListRef {
  refreshTasks: () => Promise<void>;
}

const DashboardTaskList = forwardRef<DashboardTaskListRef, DashboardTaskListProps>(({ userId }, ref) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenRoutines, setHiddenRoutines] = useState<Set<string>>(new Set());

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

  // Fetch active tasks function
  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Fetch tasks with stage info for immutability checking
      const response = await fetch(`/api/tasks?type=active&includeStageInfo=true`);
      
      if (!response.ok) {
        throw new Error(`Error fetching tasks: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshTasks: fetchTasks
  }));

  // Fetch active tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Handle completing a task
  const handleTaskComplete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}?type=active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
          completedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "TASK_IMMUTABLE") {
          addToast({
            title: "Task Locked",
            description: "This task cannot be modified as it belongs to a previous stage.",
            color: "warning",
          });
          return;
        }
        throw new Error(`Error updating task: ${response.statusText}`);
      }

      const updatedTask = await response.json();
      
      // Update task in local state
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task))
      );
    } catch (err) {
      console.error("Error completing task:", err);
      setError((err as Error).message);
    }
  };

  // Handle marking a task as missed
  const handleTaskMissed = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}?type=active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "missed",
          missedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "TASK_IMMUTABLE") {
          addToast({
            title: "Task Locked",
            description: "This task cannot be modified as it belongs to a previous stage.",
            color: "warning",
          });
          return;
        }
        throw new Error(`Error updating task: ${response.statusText}`);
      }

      const updatedTask = await response.json();
      
      // Update task in local state
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task))
      );
    } catch (err) {
      console.error("Error marking task as missed:", err);
      setError((err as Error).message);
    }
  };

  // Handle undoing a task (reset to default state)
  const handleTaskUndo = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}?type=active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "todo",
          completedAt: null,
          missedAt: null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "TASK_IMMUTABLE") {
          addToast({
            title: "Task Locked",
            description: "This task cannot be modified as it belongs to a previous stage.",
            color: "warning",
          });
          return;
        }
        throw new Error(`Error updating task: ${response.statusText}`);
      }

      const updatedTask = await response.json();
      
      // Update task in local state
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task))
      );
    } catch (err) {
      console.error("Error resetting task:", err);
      setError((err as Error).message);
    }
  };

  // Filter tasks to exclude those from hidden routines
  const visibleTasks = tasks.filter(task => {
    // If the task has a routineId, check if it's hidden
    if (task.routineId) {
      return !hiddenRoutines.has(task.routineId);
    }
    // If no routineId, show the task (for backwards compatibility)
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="md" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-lg">
        Error loading tasks: {error}
      </div>
    );
  }

  if (visibleTasks.length === 0) {
    return (
      <div className="text-center py-8 text-default-500">
        <p>You don't have any active tasks for today.</p>
        {tasks.length > 0 && hiddenRoutines.size > 0 && (
          <p className="text-sm mt-2 text-default-400">
            {tasks.length} tasks are hidden from routine settings.
          </p>
        )}
      </div>
    );
  }

  // Separate immutable and mutable tasks for better UX
  const mutableTasks = visibleTasks.filter(task => !task.isImmutable);
  const immutableTasks = visibleTasks.filter(task => task.isImmutable);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-default-900 mb-4">Active Tasks</h2>
      
      {/* Mutable tasks first */}
      <div className="space-y-2">
        {mutableTasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onComplete={handleTaskComplete}
            onMissed={handleTaskMissed}
            onUndo={handleTaskUndo}
            isImmutable={false}
          />
        ))}
      </div>

      {/* Immutable tasks section */}
      {immutableTasks.length > 0 && (
        <>
          <div className="border-t border-default-200 pt-4 mt-6">
            <h3 className="text-lg font-medium text-default-700 mb-3 flex items-center gap-2">
              <span>Previous Stage Tasks</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400">
                Locked
              </span>
            </h3>
          </div>
          <div className="space-y-2">
            {immutableTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onComplete={handleTaskComplete}
                onMissed={handleTaskMissed}
                onUndo={handleTaskUndo}
                isImmutable={true}
                stageNumber={task.stageNumber}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});

export default DashboardTaskList; 