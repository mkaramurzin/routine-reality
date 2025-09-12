"use client";

import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
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

export default function UnmarkedTasksModal() {
  const [open, setOpen] = useState(false);
  const [tasksByRoutine, setTasksByRoutine] = useState<Record<string, UnmarkedTask[]>>({});
  const [routineTitles, setRoutineTitles] = useState<RoutineMap>({});

  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem("unmarkedTasksLastShown");
    if (lastShown === today) return;

    const fetchData = async () => {
      try {
        const res = await fetch("/api/tasks?type=unmarked");
        if (!res.ok) return;
        const tasks: UnmarkedTask[] = await res.json();
        if (!tasks.length) return;

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

        setOpen(true);
      } catch (err) {
        console.error("Failed to fetch unmarked tasks", err);
      }
    };

    fetchData();
  }, []);

  const handleClose = () => {
    localStorage.setItem("unmarkedTasksLastShown", new Date().toDateString());
    setOpen(false);
  };

  const routineIds = Object.keys(tasksByRoutine);

  return (
    <Modal isOpen={open} onOpenChange={setOpen} placement="top-center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Unmarked Tasks</ModalHeader>
            <ModalBody>
              <p className="mb-2">You have unmarked tasks from yesterday:</p>
              <ul className="list-disc pl-6 space-y-1">
                {routineIds.map((id) => (
                  <li key={id}>
                    {tasksByRoutine[id].length} in{" "}
                    <Link href={`/routines/${id}`} className="underline">
                      {routineTitles[id] || "View routine"}
                    </Link>
                  </li>
                ))}
              </ul>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={() => { handleClose(); onClose(); }}>
                Got it
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
