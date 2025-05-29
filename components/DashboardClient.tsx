"use client";

import React, { useRef } from "react";
import RoutineList from "./RoutineList";
import DashboardTaskList, { DashboardTaskListRef } from "./DashboardTaskList";

interface RoutineListRef {
  refreshRoutines: () => Promise<void>;
}

interface DashboardClientProps {
  userId: string;
}

const DashboardClient: React.FC<DashboardClientProps> = ({ userId }) => {
  const taskListRef = useRef<DashboardTaskListRef>(null);
  const routineListRef = useRef<RoutineListRef>(null);

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
  };

  return (
    <div className="space-y-12">
      {/* Routines Section */}
      <section>
        <RoutineList ref={routineListRef} onRoutineSkipped={handleRoutineSkipped} />
      </section>

      {/* Today's Tasks Section */}
      <section>
        <h2 className="text-2xl font-bold text-default-900 mb-6">Today's Tasks</h2>
        <DashboardTaskList ref={taskListRef} userId={userId} />
      </section>
    </div>
  );
};

export default DashboardClient; 