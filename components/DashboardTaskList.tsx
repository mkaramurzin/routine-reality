"use client";

import React, { useState, useEffect } from "react";
import TaskCard from "./TaskCard";
import { Spinner } from "@heroui/spinner";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed" | "missed";
}

interface DashboardTaskListProps {
  userId: string;
}

const DashboardTaskList: React.FC<DashboardTaskListProps> = ({ userId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch active tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // Note: We need to add the routineId as it seems to be required by the API
        // For now, we'll just use a placeholder value, but this should be adjusted in a real implementation
        const routineId = "4819be67-e550-42c3-90fc-ab56d5aa6568"; // This should be replaced with a real routine ID
        const response = await fetch(`/api/tasks?type=active&routineId=${routineId}`);
        
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
        throw new Error(`Error updating task: ${response.statusText}`);
      }

      const updatedTask = await response.json();
      
      // Update task in local state
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
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
        throw new Error(`Error updating task: ${response.statusText}`);
      }

      const updatedTask = await response.json();
      
      // Update task in local state
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
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
        throw new Error(`Error updating task: ${response.statusText}`);
      }

      const updatedTask = await response.json();
      
      // Update task in local state
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (err) {
      console.error("Error resetting task:", err);
      setError((err as Error).message);
    }
  };

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

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-default-500">
        <p>You don't have any active tasks for today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-default-900 mb-4">Active Tasks</h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onComplete={handleTaskComplete}
            onMissed={handleTaskMissed}
            onUndo={handleTaskUndo}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardTaskList; 