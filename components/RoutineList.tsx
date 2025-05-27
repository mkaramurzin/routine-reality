"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import { ArrowRight, Trophy, Calendar, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserRoutines } from "@/lib/api/routines";

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

const RoutineList: React.FC = () => {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-default-900">Your Routines</h2>
        <Button color="primary" variant="flat" size="sm" onPress={() => router.push('/routines/select')}>
          Add Routine
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routines.map((routine) => (
          <Card
            key={routine.id}
            className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            isPressable
            onPress={() => router.push(`/routines/${routine.id}`)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                {routine.status === "finished" ? (
                  <Trophy className="h-5 w-5 text-amber-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-primary-400 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                  </div>
                )}
                <h3 className="font-semibold text-default-900 truncate">
                  {routine.title}
                </h3>
              </div>
              <p className={`text-xs font-medium ${getStatusColor(routine.status)}`}>
                {routine.status.charAt(0).toUpperCase() + routine.status.slice(1)}
              </p>
            </CardHeader>

            <CardBody className="pt-2 space-y-4">
              <p className="text-sm text-default-600 line-clamp-2">
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
                    color="primary"
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

              {/* Dates and action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-default-500">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(routine.startDate)} - {formatDate(routine.endDate)}
                  </span>
                </div>
                
                {/* <Button
                  variant="light"
                  size="sm"
                  endContent={<ArrowRight className="h-3 w-3" />}
                  className="text-primary-600"
                >
                  View
                </Button> */}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoutineList; 