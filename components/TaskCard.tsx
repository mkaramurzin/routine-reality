import React from "react";
import { Button } from "@heroui/button";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed" | "missed";
  categoryColor?: string; // Optional color property for the task
}

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onMissed: (taskId: string) => void; // New prop for missed action
  onUndo: (taskId: string) => void; // New prop for undoing a task status
  currentTheme?: "light" | "dark"; // Theme prop for adjusting styles
}

interface StyleProps {
  background: string;
  borderColor: string;
  boxShadow: string;
  borderLeft: string;
  opacity?: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onComplete, 
  onMissed, 
  onUndo,
  currentTheme = "dark" 
}) => {
  const isCompleted = task.status === "completed";
  const isMissed = task.status === "missed";
  const cardColor = task.categoryColor || "#1E90FF"; // Use provided color or default to blue
  
  // Calculate background color based on theme and status
  const getBgStyle = (): StyleProps => {
    // Base styles depending on theme
    let baseStyles = currentTheme === "light" 
      ? {
          background: `linear-gradient(to right, ${cardColor}15, ${cardColor}05)`,
          borderColor: `${cardColor}50`,
          boxShadow: `0 4px 6px -1px ${cardColor}10, 0 2px 4px -1px ${cardColor}05`,
          borderLeft: `3px solid ${cardColor}`
        }
      : {
          background: `linear-gradient(to right, ${cardColor}30, ${cardColor}15)`,
          borderColor: cardColor,
          boxShadow: `0 4px 6px -1px ${cardColor}30, 0 2px 4px -1px ${cardColor}20`,
          borderLeft: `3px solid ${cardColor}`
        };
        
    // Modify styles based on status
    if (isCompleted) {
      return {
        ...baseStyles,
        opacity: 0.85,
        background: currentTheme === "light" 
          ? `linear-gradient(to right, ${cardColor}10, ${cardColor}05)`
          : `linear-gradient(to right, ${cardColor}20, ${cardColor}10)`,
        borderLeft: `3px solid ${cardColor}80`
      };
    }
    
    if (isMissed) {
      return {
        ...baseStyles,
        opacity: 0.7,
        background: currentTheme === "light"
          ? `linear-gradient(to right, #88888815, #88888805)`
          : `linear-gradient(to right, #33333330, #33333315)`,
        borderLeft: `3px solid #888888`
      };
    }
    
    return baseStyles;
  };
  
  const styles = getBgStyle();
  
  return (
    <div 
      className="rounded-lg p-4 mb-3 border transition-all duration-300 hover:shadow-lg group relative" 
      style={{ 
        background: styles.background,
        borderLeft: styles.borderLeft,
        borderColor: styles.borderColor,
        boxShadow: styles.boxShadow,
        opacity: styles.opacity
      }}
    >
      {/* Undo button that appears on hover for completed/missed tasks */}
      {(isCompleted || isMissed) && (
        <div className="absolute top-0 right-0 bottom-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pr-4">
          <Button
            onClick={() => onUndo(task.id)}
            size="sm"
            variant="ghost"
            className="text-default-500 hover:text-default-700 flex items-center gap-1"
          >
            <RotateCcw size={14} />
            <span>Undo</span>
          </Button>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-green-500' : isMissed ? 'bg-gray-400' : ''}`} 
              style={{ backgroundColor: !isCompleted && !isMissed ? cardColor : undefined }}
            ></div>
            <h3 
              className={`font-medium text-lg text-default-900 ${isCompleted ? 'line-through opacity-80' : ''} ${isMissed ? 'opacity-70' : ''}`}
            >
              {task.title}
            </h3>
          </div>
          {task.description && (
            <p className={`text-default-600 mt-1 pl-5 ${isCompleted ? 'opacity-80' : ''} ${isMissed ? 'opacity-70' : ''}`}>
              {task.description}
            </p>
          )}
        </div>
        
        <div>
          {isCompleted ? (
            <div className="flex items-center text-green-500 group-hover:invisible">
              <CheckCircle className="w-5 h-5 mr-1" />
              <span className="text-sm">Completed</span>
            </div>
          ) : isMissed ? (
            <div className="flex items-center text-gray-500 group-hover:invisible">
              <XCircle className="w-5 h-5 mr-1" />
              <span className="text-sm">Missed</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={() => onComplete(task.id)}
                size="sm" 
                variant="flat"
                style={{
                  color: cardColor,
                  borderColor: cardColor
                }}
              >
                Complete
              </Button>
              <Button 
                onClick={() => onMissed(task.id)}
                size="sm" 
                variant="flat"
                className="text-gray-500 border-gray-400"
              >
                Miss
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard; 