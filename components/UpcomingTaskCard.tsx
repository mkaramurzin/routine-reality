"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { SkipForwardIcon, UndoIcon, ClockIcon } from "lucide-react";

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

interface UpcomingTaskCardProps {
  task: UpcomingTask;
  onSkip: (taskId: string) => void;
  onUndo: (taskId: string) => void;
}

const UpcomingTaskCard: React.FC<UpcomingTaskCardProps> = ({
  task,
  onSkip,
  onUndo,
}) => {
  const handleSkip = () => {
    onSkip(task.id);
  };

  const handleUndo = () => {
    onUndo(task.id);
  };

  return (
    <Card className={`w-full ${task.isSkipped ? 'opacity-60' : 'opacity-80'} border-dashed border-2 border-default-300`}>
      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon size={16} className="text-default-400 flex-shrink-0" />
              <h3 className={`font-medium text-default-700 truncate ${task.isSkipped ? 'line-through' : ''}`}>
                {task.title}
              </h3>
              <Badge
                size="sm"
                variant="flat"
                color="primary"
                className="ml-auto flex-shrink-0"
              >
                Upcoming
              </Badge>
            </div>
            
            {task.description && (
              <p className={`text-sm text-default-500 mb-2 ${task.isSkipped ? 'line-through' : ''}`}>
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 text-xs text-default-400">
              <span>{task.routineTitle}</span>
              {task.isOptional && (
                <Badge size="sm" variant="flat" color="secondary">
                  Optional
                </Badge>
              )}
              <span>•</span>
              <span>Stage {task.stageNumber}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 flex-shrink-0">
            {task.isSkipped ? (
              <Button
                size="sm"
                variant="flat"
                color="default"
                startContent={<UndoIcon size={14} />}
                onClick={handleUndo}
                className="text-xs"
              >
                Undo
              </Button>
            ) : (
              <Button
                size="sm"
                variant="flat"
                color="warning"
                startContent={<SkipForwardIcon size={14} />}
                onClick={handleSkip}
                className="text-xs"
              >
                Skip
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default UpcomingTaskCard; 