"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import TaskCard from "./TaskCard";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed" | "missed" | "skipped";
  scheduledFor?: string;
  completedAt?: string;
  missedAt?: string;
}

interface RoutineTaskListProps {
  routineId: string;
  onTaskUpdate?: () => void; // Callback to notify parent of task updates
}

export interface RoutineTaskListRef {
  refreshTasks: () => Promise<void>;
}

const RoutineTaskList = forwardRef<RoutineTaskListRef, RoutineTaskListProps>(({ routineId, onTaskUpdate }, ref) => {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
  const [unmarkedTasks, setUnmarkedTasks] = useState<Task[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [unmarkedLoading, setUnmarkedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("active");

  // Fetch active tasks function
  const fetchActiveTasks = async () => {
    try {
      setActiveLoading(true);
      const response = await fetch(`/api/tasks?type=active&routineId=${routineId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching active tasks: ${response.statusText}`);
      }
      
      const data = await response.json();
      setActiveTasks(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching active tasks:", err);
    } finally {
      setActiveLoading(false);
    }
  };

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshTasks: fetchActiveTasks
  }));

  // Fetch active tasks on component mount
  useEffect(() => {
    if (routineId) {
      fetchActiveTasks();
    }
  }, [routineId]);

  // Fetch task history when history tab is selected
  const fetchTaskHistory = async () => {
    if (historyTasks.length > 0) return; // Don't fetch if already loaded
    
    try {
      setHistoryLoading(true);
      const response = await fetch(`/api/tasks?type=history&routineId=${routineId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching task history: ${response.statusText}`);
      }
      
      const data = await response.json();
      setHistoryTasks(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching task history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch unmarked tasks when unmarked tab is selected
  const fetchUnmarkedTasks = async () => {
    if (unmarkedTasks.length > 0) return; // Don't fetch if already loaded
    
    try {
      setUnmarkedLoading(true);
      const response = await fetch(`/api/tasks?type=unmarked&routineId=${routineId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching unmarked tasks: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUnmarkedTasks(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching unmarked tasks:", err);
    } finally {
      setUnmarkedLoading(false);
    }
  };

  // Handle tab selection
  const handleTabChange = (key: React.Key) => {
    const tabKey = key.toString();
    setSelectedTab(tabKey);
    
    if (tabKey === "history") {
      fetchTaskHistory();
    } else if (tabKey === "unmarked") {
      fetchUnmarkedTasks();
    }
  };

  // Handle completing a task (only for active tasks)
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
        throw new Error(`Error updating task: ${response.statusText}`);
      }

      const updatedTask = await response.json();
      
      // Update task in local state
      setActiveTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );

      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (err) {
      console.error("Error completing task:", err);
      setError((err as Error).message);
    }
  };

  // Handle marking a task as missed (only for active tasks)
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
        throw new Error(`Error updating task: ${response.statusText}`);
      }

      const updatedTask = await response.json();
      
      // Update task in local state
      setActiveTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );

      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (err) {
      console.error("Error marking task as missed:", err);
      setError((err as Error).message);
    }
  };

  // Handle undoing a task (only for active tasks)
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
        throw new Error(`Error updating task: ${response.statusText}`);
      }

      const updatedTask = await response.json();
      
      // Update task in local state
      setActiveTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );

      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (err) {
      console.error("Error resetting task:", err);
      setError((err as Error).message);
    }
  };

  // Handle resolving an unmarked task as completed
  const handleUnmarkedTaskComplete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}?type=unmarked`, {
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
        throw new Error(`Error updating task: ${response.statusText}`);
      }

      // Remove task from local state
      setUnmarkedTasks((prev) => prev.filter((t) => t.id !== taskId));

      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (err) {
      console.error("Error completing unmarked task:", err);
      setError((err as Error).message);
    }
  };

  // Handle resolving an unmarked task as missed
  const handleUnmarkedTaskMissed = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}?type=unmarked`, {
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
        throw new Error(`Error updating task: ${response.statusText}`);
      }

      setUnmarkedTasks((prev) => prev.filter((t) => t.id !== taskId));

      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (err) {
      console.error("Error marking unmarked task as missed:", err);
      setError((err as Error).message);
    }
  };

  // Render task list for each tab
  const renderTaskList = (
    tasks: Task[],
    loading: boolean,
    emptyMessage: string,
    showActions: boolean = false,
    isHistorical: boolean = false,
    handlers?: {
      onComplete?: (id: string) => void;
      onMissed?: (id: string) => void;
      onUndo?: (id: string) => void;
    }
  ) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spinner size="md" color="primary" />
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className="text-center py-8 text-default-500">
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={showActions ? handlers?.onComplete : undefined}
            onMissed={showActions ? handlers?.onMissed : undefined}
            onUndo={showActions ? handlers?.onUndo : undefined}
            isHistorical={isHistorical}
          />
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-lg">
        Error loading tasks: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-default-900 mb-4">Tasks</h2>
      
      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={handleTabChange}
        variant="underlined"
        color="primary"
      >
        <Tab 
          key="active" 
          title={
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Today's Tasks</span>
            </div>
          }
        >
          {renderTaskList(
            activeTasks,
            activeLoading,
            "No active tasks for this routine today.",
            true,
            false,
            {
              onComplete: handleTaskComplete,
              onMissed: handleTaskMissed,
              onUndo: handleTaskUndo,
            }
          )}
        </Tab>
        
        <Tab 
          key="history" 
          title={
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Task History</span>
            </div>
          }
        >
          {renderTaskList(historyTasks, historyLoading, "No task history available for this routine.", false, true)}
        </Tab>
        
        <Tab 
          key="unmarked" 
          title={
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Unmarked Tasks</span>
            </div>
          }
        >
          {renderTaskList(
            unmarkedTasks,
            unmarkedLoading,
            "No unmarked tasks for this routine.",
            true,
            false,
            {
              onComplete: handleUnmarkedTaskComplete,
              onMissed: handleUnmarkedTaskMissed,
            }
          )}
        </Tab>
      </Tabs>
    </div>
  );
});

export default RoutineTaskList; 