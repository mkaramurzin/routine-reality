"use client";

import React, { useRef, useState, useEffect } from "react";
import RoutineList, { RoutineListRef } from "./RoutineList";
import DashboardTaskList, { DashboardTaskListRef } from "./DashboardTaskList";
import UpcomingTaskList from "./UpcomingTaskList";

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

  return (
    <div className="space-y-12">
      {/* Routines Section */}
      <section>
        <RoutineList ref={routineListRef} onRoutineSkipped={handleRoutineSkipped} />
      </section>

      {/* Tasks Section */}
      <section>
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
      </section>
    </div>
  );
};

export default DashboardClient; 