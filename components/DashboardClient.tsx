"use client";

import React, { useRef, useState, useEffect } from "react";
import RoutineList, { RoutineListRef } from "./RoutineList";
import DashboardTaskList, { DashboardTaskListRef } from "./DashboardTaskList";
import UpcomingTaskList from "./UpcomingTaskList";
import UnmarkedTasksBanner from "./UnmarkedTasksBanner";
import CustomTaskForm from "./CustomTaskForm";

interface DashboardClientProps {
  userId: string;
  userTimezone?: string;
}

const DashboardClient: React.FC<DashboardClientProps> = ({ userId, userTimezone }) => {
  const taskListRef = useRef<DashboardTaskListRef>(null);
  const routineListRef = useRef<RoutineListRef>(null);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if all today's tasks are finalized (completed, missed)
  const checkTasksFinalized = async () => {
    try {
      const response = await fetch(`/api/tasks?type=active&includeStageInfo=true`);
      if (response.ok) {
        const tasks = await response.json();
        setActiveTasks(tasks);
        
        // Show upcoming if all tasks are finalized (completed, missed) or no tasks exist
        const allFinalized = tasks.length === 0 || tasks.every((task: any) => 
          task.status === 'completed' || task.status === 'missed'
        );
        setShowUpcoming(allFinalized);
      }
    } catch (error) {
      console.error('Error checking task status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check task status on mount and when tasks update
  useEffect(() => {
    checkTasksFinalized();
  }, []);

  const handleRoutineSkipped = async () => {
    // Refresh both the task list and routine list when a routine is skipped
    const refreshPromises = [];
    
    if (taskListRef.current) {
      refreshPromises.push(taskListRef.current.refreshTasks());
    }
    
    if (routineListRef.current) {
      refreshPromises.push(routineListRef.current.refreshRoutines());
    }

    await Promise.all(refreshPromises);
    
    // Re-check if we should show upcoming tasks
    checkTasksFinalized();
  };

  const handleTaskUpdate = async () => {
    // Refresh the routine list when tasks are updated to sync stage progress
    if (routineListRef.current) {
      await routineListRef.current.refreshRoutines();
    }
    
    // Re-check if we should show upcoming tasks
    checkTasksFinalized();
  };

  const handleCustomTaskSuccess = async () => {
    // Refresh the task list when a custom task is created
    if (taskListRef.current) {
      await taskListRef.current.refreshTasks();
    }
    
    // Re-check if we should show upcoming tasks
    checkTasksFinalized();
  };

  return (
    <div className="space-y-8">
      {/* Desktop Layout: Custom Task Form + Unmarked Tasks (1/3) | Today's Tasks (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Custom Tasks & Unmarked Tasks */}
        <div className="lg:col-span-1 space-y-6">
          {/* Custom Task Form */}
          <CustomTaskForm onSuccess={handleCustomTaskSuccess} />
          
          {/* Unmarked Tasks Banner */}
          <UnmarkedTasksBanner onTaskUpdate={handleTaskUpdate} />
        </div>

        {/* Right Column - Today's Tasks */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-8 text-default-500">
              <p>Loading tasks...</p>
            </div>
          ) : showUpcoming ? (
            <UpcomingTaskList userId={userId} userTimezone={userTimezone} />
          ) : (
            <>
              <h2 className="text-2xl font-bold text-default-900 mb-6">Today's Tasks</h2>
              <DashboardTaskList ref={taskListRef} userId={userId} onTaskUpdate={handleTaskUpdate} />
            </>
          )}
        </div>
      </div>

      {/* Full Width Routines Section */}
      <section className="mt-12">
        <RoutineList ref={routineListRef} onRoutineSkipped={handleRoutineSkipped} />
      </section>
    </div>
  );
};

export default DashboardClient; 