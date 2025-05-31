"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Checkbox } from "@heroui/checkbox";
import { ArrowLeft, Calendar, Target, Info } from "lucide-react";
import StageProgressionPanel from "@/components/StageProgressionPanel";
import RoutineTaskList, { RoutineTaskListRef } from "@/components/RoutineTaskList";
import RoutineControlsDropdown from "@/components/RoutineControlsDropdown";
import { getRoutineById, advanceRoutineStage } from "@/lib/api/routines";

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
}

export default function RoutineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routineId = params.id as string;
  const taskListRef = useRef<RoutineTaskListRef>(null);

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressRefreshTrigger, setProgressRefreshTrigger] = useState(0);
  const [showRoutineInfo, setShowRoutineInfo] = useState(false);

  // Fetch routine data on mount
  useEffect(() => {
    if (!routineId) return;

    const fetchRoutine = async () => {
      try {
        setLoading(true);
        const data = await getRoutineById(routineId);
        setRoutine(data);
      } catch (err) {
        setError((err as Error).message);
        console.error("Error fetching routine:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutine();
  }, [routineId]);

  // Handle stage advancement
  const handleStageAdvancement = async (routineId: string) => {
    try {
      const updatedRoutine = await advanceRoutineStage(routineId);
      setRoutine(updatedRoutine);
      // Trigger progress refresh
      setProgressRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error advancing stage:", err);
      throw err; // Re-throw to let component handle it
    }
  };

  // Function to trigger progress refresh when tasks are updated
  const handleTaskUpdate = () => {
    setProgressRefreshTrigger(prev => prev + 1);
  };

  // Function to refresh routine data when controls are used
  const handleRoutineUpdated = async () => {
    if (!routineId) return;
    
    try {
      // Refresh routine data
      const data = await getRoutineById(routineId);
      setRoutine(data);
      
      // Also trigger progress refresh
      setProgressRefreshTrigger(prev => prev + 1);
      
      // Refresh task list to show newly served tasks (important for reset/resume)
      if (taskListRef.current) {
        await taskListRef.current.refreshTasks();
      }
    } catch (err) {
      console.error("Error refreshing routine:", err);
    }
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-default-50">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-default-600">Loading routine...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="min-h-screen flex flex-col bg-default-50">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-danger-600 mb-4">
              {error || "Routine not found"}
            </p>
            <Button onClick={() => router.push("/dashboard")} variant="flat">
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const statusColor = {
    active: "text-success-600",
    finished: "text-warning-600",
    paused: "text-default-500",
    abandoned: "text-danger-600",
  };

  return (
    <div className="min-h-screen flex flex-col bg-default-50">
      <main className="flex-1 container mx-auto py-8 px-6 max-w-4xl">
        {/* Header with Back button, Calendar View button, and Controls dropdown */}
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="flat"
            startContent={<ArrowLeft className="h-4 w-4" />}
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              variant="solid"
            >
              Calendar View
            </Button>
            
            <RoutineControlsDropdown 
              routine={routine} 
              onRoutineUpdated={handleRoutineUpdated}
            />
          </div>
        </div>

        <div className="grid gap-6">
          {/* Stage Progression Panel */}
          <StageProgressionPanel
            routineId={routine.id}
            onStageAdvancement={handleStageAdvancement}
            refreshTrigger={progressRefreshTrigger}
          />

          {/* Today's Tasks Section */}
          <RoutineTaskList 
            ref={taskListRef}
            routineId={routine.id} 
            onTaskUpdate={handleTaskUpdate}
          />

          {/* Routine Information Toggle */}
          <div className="mb-4">
            <Checkbox
              isSelected={showRoutineInfo}
              onValueChange={setShowRoutineInfo}
            >
              Show Routine Details
            </Checkbox>
          </div>

          {/* Routine Information */}
          {showRoutineInfo && (
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-default-900">
                    {routine.title}
                  </h1>
                  <p className={`text-sm font-medium ${statusColor[routine.status]}`}>
                    Status: {routine.status.charAt(0).toUpperCase() + routine.status.slice(1)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-default-600">Type</p>
                  <p className="font-medium text-default-900 capitalize">
                    {routine.routineType}
                  </p>
                </div>
              </CardHeader>

              <CardBody className="space-y-6">
                {/* Description */}
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-default-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-default-900 mb-1">Description</h3>
                    <p className="text-default-600">{routine.routineInfo}</p>
                  </div>
                </div>

                {/* Date Range */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-default-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-default-900 mb-1">Duration</h3>
                    <p className="text-default-600">
                      {formatDate(routine.startDate)} - {formatDate(routine.endDate)}
                    </p>
                  </div>
                </div>

                {/* Stage Details */}
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-default-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-default-900 mb-1">Stage Structure</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-default-600">Total Stages</p>
                        <p className="font-medium text-default-900">{routine.stages}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-600">Current Stage</p>
                        <p className="font-medium text-default-900">
                          Stage {routine.currentStage} of {routine.stages}
                        </p>
                      </div>
                    </div>
                    
                    {routine.thresholds.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-default-600 mb-2">Stage Thresholds</p>
                        <div className="flex flex-wrap gap-2">
                          {routine.thresholds.map((threshold, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded text-xs ${
                                index < routine.currentStage - 1
                                  ? "bg-success-100 text-success-700"
                                  : index === routine.currentStage - 1
                                  ? "bg-primary-100 text-primary-700"
                                  : "bg-default-100 text-default-600"
                              }`}
                            >
                              Stage {index + 1}: {threshold} tasks
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
} 