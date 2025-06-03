"use client";

import React, { useState, useEffect } from "react";
import UpcomingTaskCard from "./UpcomingTaskCard";
import CountdownTimer from "./CountdownTimer";
import { Spinner } from "@heroui/spinner";

interface UpcomingTask {
  id: string;
  title: string;
  description: string | null;
  isOptional: boolean;
  order: number | null;
  status: "upcoming";
  stageNumber: number;
  routineTitle: string;
  routineId: string;
  scheduledFor: Date;
  isSkipped?: boolean;
}

interface UpcomingTaskListProps {
  userId: string;
  userTimezone?: string;
}

const UpcomingTaskList: React.FC<UpcomingTaskListProps> = ({ userId, userTimezone }) => {
  const [tasks, setTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skippedTasks, setSkippedTasks] = useState<Set<string>>(new Set());

  // Load skipped tasks from localStorage
  useEffect(() => {
    const savedSkipped = localStorage.getItem('skippedUpcomingTasks');
    if (savedSkipped) {
      try {
        const skippedIds = JSON.parse(savedSkipped);
        setSkippedTasks(new Set(skippedIds));
      } catch (err) {
        console.error('Error loading skipped tasks:', err);
      }
    }
  }, []);

  // Save skipped tasks to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('skippedUpcomingTasks', JSON.stringify(Array.from(skippedTasks)));
  }, [skippedTasks]);

  // Fetch upcoming tasks
  useEffect(() => {
    const fetchUpcomingTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tasks?type=upcoming');
        
        if (!response.ok) {
          throw new Error(`Error fetching upcoming tasks: ${response.statusText}`);
        }
        
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        setError((err as Error).message);
        console.error("Error fetching upcoming tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingTasks();
  }, []);

  const handleSkip = (taskId: string) => {
    setSkippedTasks(prev => new Set(prev).add(taskId));
  };

  const handleUndo = (taskId: string) => {
    setSkippedTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  };

  // Enhance tasks with skip status
  const enhancedTasks = tasks.map(task => ({
    ...task,
    isSkipped: skippedTasks.has(task.id)
  }));

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
        Error loading upcoming tasks: {error}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-default-500">
        <p>No upcoming tasks scheduled for tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-default-900 mb-4">Upcoming Tasks</h2>
        <CountdownTimer userTimezone={userTimezone} />
      </div>
      
      <div className="space-y-2">
        {enhancedTasks.map((task) => (
          <UpcomingTaskCard 
            key={task.id} 
            task={task} 
            onSkip={handleSkip}
            onUndo={handleUndo}
          />
        ))}
      </div>
      
      <div className="text-center text-xs text-default-400 mt-6">
        <p>These tasks will be available tomorrow at 5:00 AM.</p>
        <p>You can skip tasks now to avoid them in your daily list.</p>
      </div>
    </div>
  );
};

export default UpcomingTaskList; 