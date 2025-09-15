"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import Link from "next/link";

interface UnmarkedTask {
  id: string;
  routineId: string;
  title: string;
}

interface RoutineMap {
  [key: string]: string;
}

interface Props {
  onTaskUpdate?: () => void;
}

export default function UnmarkedTasksBanner({ onTaskUpdate }: Props) {
  const [tasksByRoutine, setTasksByRoutine] = useState<Record<string, UnmarkedTask[]>>({});
  const [routineTitles, setRoutineTitles] = useState<RoutineMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/tasks?type=unmarked");
        if (!res.ok) return;
        const tasks: UnmarkedTask[] = await res.json();
        if (!tasks.length) {
          setLoading(false);
          return;
        }

        const grouped: Record<string, UnmarkedTask[]> = {};
        tasks.forEach((task) => {
          grouped[task.routineId] = grouped[task.routineId] || [];
          grouped[task.routineId].push(task);
        });
        setTasksByRoutine(grouped);

        const routineRes = await fetch("/api/routines");
        if (routineRes.ok) {
          const routines = await routineRes.json();
          const titles: RoutineMap = {};
          routines.forEach((r: any) => (titles[r.id] = r.title));
          setRoutineTitles(titles);
        }
      } catch (err) {
        console.error("Failed to fetch unmarked tasks", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const resolveTask = async (taskId: string, status: "completed" | "missed") => {
    try {
      const res = await fetch(`/api/tasks/${taskId}?type=unmarked`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(status === "completed"
            ? { completedAt: new Date().toISOString() }
            : { missedAt: new Date().toISOString() }),
        }),
      });
      if (!res.ok) return;

      setTasksByRoutine((prev) => {
        const updated: Record<string, UnmarkedTask[]> = {};
        for (const [rid, tasks] of Object.entries(prev)) {
          const filtered = tasks.filter((t) => t.id !== taskId);
          if (filtered.length > 0) {
            updated[rid] = filtered;
          }
        }
        return updated;
      });

      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (err) {
      console.error("Error resolving unmarked task:", err);
    }
  };

  const routineIds = Object.keys(tasksByRoutine);
  if (loading || routineIds.length === 0) return null;

  return (
    <div className="rounded-lg border border-default-200 bg-default-100 p-4 mb-8">
      <p className="font-medium mb-2">You have unmarked tasks from yesterday:</p>
      {routineIds.map((id) => (
        <div key={id} className="mb-4 last:mb-0">
          <h4 className="font-semibold">
            <Link href={`/routines/${id}`} className="underline">
              {routineTitles[id] || "View routine"}
            </Link>
          </h4>
          <ul className="space-y-2 mt-2">
            {tasksByRoutine[id].map((task) => (
              <li key={task.id} className="flex items-center justify-between">
                <span className="mr-4">{task.title}</span>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    color="success"
                    onPress={() => resolveTask(task.id, "completed")}
                  >
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    onPress={() => resolveTask(task.id, "missed")}
                  >
                    Miss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

