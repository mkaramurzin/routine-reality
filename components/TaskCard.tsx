import React from "react";
import { Button } from "@heroui/button";
import { CheckCircle, XCircle, RotateCcw, SkipForward, Lock } from "lucide-react";
import { getTaskColors, WELLNESS_COLORS, type WellnessCategory } from "@/lib/wellnessColors";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed" | "missed" | "skipped";
  wellnessCategories?: WellnessCategory[]; // New wellness categories array
  categoryColor?: string; // Keep for backward compatibility
}

interface TaskCardProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  onMissed?: (taskId: string) => void; // New prop for missed action
  onUndo?: (taskId: string) => void; // New prop for undoing a task status
  currentTheme?: "light" | "dark"; // Theme prop for adjusting styles
  isHistorical?: boolean; // Flag to indicate if this is a historical task (no actions available)
  isImmutable?: boolean; // Flag to indicate if this task is immutable/locked
  stageNumber?: number; // Stage number for immutable tasks
}

interface StyleProps {
  background?: string;
  backgroundImage?: string;
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
  currentTheme = "dark",
  isHistorical = false,
  isImmutable = false,
  stageNumber
}) => {
  const isCompleted = task.status === "completed";
  const isMissed = task.status === "missed";
  const isSkipped = task.status === "skipped";
  
  // Get wellness category colors or fallback to legacy categoryColor or default
  const wellnessColors = getTaskColors(task.wellnessCategories || []);
  const cardColor = task.categoryColor || "#1E90FF"; // Fallback for backward compatibility
  const primaryWellnessColor = task.wellnessCategories && task.wellnessCategories.length > 0 
    ? WELLNESS_COLORS[task.wellnessCategories[0]] 
    : cardColor;
  
  // Calculate background color based on theme and status
  const getBgStyle = (): StyleProps => {
    // Use wellness categories if available
    if (task.wellnessCategories && task.wellnessCategories.length > 0) {
      let baseStyles = currentTheme === "light" 
        ? {
            ...wellnessColors,
            borderColor: `${primaryWellnessColor}50`,
            boxShadow: `0 4px 6px -1px ${primaryWellnessColor}10, 0 2px 4px -1px ${primaryWellnessColor}05`,
            borderLeft: `3px solid ${primaryWellnessColor}`
          }
        : {
            ...wellnessColors,
            borderColor: primaryWellnessColor,
            boxShadow: `0 4px 6px -1px ${primaryWellnessColor}30, 0 2px 4px -1px ${primaryWellnessColor}20`,
            borderLeft: `3px solid ${primaryWellnessColor}`
          };

      // Special styling for immutable tasks
      if (isImmutable) {
        return {
          ...baseStyles,
          opacity: 0.6,
          background: currentTheme === "light"
            ? `linear-gradient(to right, #64748b15, #64748b05)`
            : `linear-gradient(to right, #64748b30, #64748b15)`,
          borderLeft: `3px solid #64748b`,
          borderColor: currentTheme === "light" ? "#64748b30" : "#64748b50"
        };
      }
            
      // Modify styles based on status
      if (isCompleted) {
        return {
          ...baseStyles,
          opacity: 0.85,
          borderLeft: `3px solid ${primaryWellnessColor}80`
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

      if (isSkipped) {
        return {
          ...baseStyles,
          opacity: 0.6,
          background: currentTheme === "light"
            ? `linear-gradient(to right, #f59e0b15, #f59e0b05)`
            : `linear-gradient(to right, #f59e0b30, #f59e0b15)`,
          borderLeft: `3px solid #f59e0b`
        };
      }
      
      return baseStyles;
    }

    // Fallback to legacy color system
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

    // Special styling for immutable tasks
    if (isImmutable) {
      return {
        ...baseStyles,
        opacity: 0.6,
        background: currentTheme === "light"
          ? `linear-gradient(to right, #64748b15, #64748b05)`
          : `linear-gradient(to right, #64748b30, #64748b15)`,
        borderLeft: `3px solid #64748b`,
        borderColor: currentTheme === "light" ? "#64748b30" : "#64748b50"
      };
    }
        
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

    if (isSkipped) {
      return {
        ...baseStyles,
        opacity: 0.6,
        background: currentTheme === "light"
          ? `linear-gradient(to right, #f59e0b15, #f59e0b05)`
          : `linear-gradient(to right, #f59e0b30, #f59e0b15)`,
        borderLeft: `3px solid #f59e0b`
      };
    }
    
    return baseStyles;
  };
  
  const styles = getBgStyle();
  
  return (
    <div 
      className={`rounded-lg p-4 mb-3 border transition-all duration-300 group relative ${
        isImmutable ? 'cursor-not-allowed' : 'hover:shadow-lg'
      }`} 
      style={{ 
        background: styles.background,
        backgroundImage: styles.backgroundImage,
        borderLeft: styles.borderLeft,
        borderColor: styles.borderColor,
        boxShadow: styles.boxShadow,
        opacity: styles.opacity
      }}
    >
      {/* Immutable indicator */}
      {isImmutable && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs">
            <Lock className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              Stage {stageNumber} - Locked
            </span>
          </div>
        </div>
      )}

      {/* Undo button that appears on hover for completed/missed tasks (not for historical, skipped, or immutable) */}
      {!isHistorical && !isSkipped && !isImmutable && (isCompleted || isMissed) && onUndo && (
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
              className={`w-3 h-3 rounded-full ${
                isCompleted ? 'bg-green-500' : 
                isMissed ? 'bg-gray-400' : 
                isSkipped ? 'bg-amber-500' :
                isImmutable ? 'bg-slate-400' : ''
              }`} 
              style={{ 
                backgroundColor: !isCompleted && !isMissed && !isSkipped && !isImmutable 
                  ? primaryWellnessColor
                  : undefined 
              }}
            ></div>
            <h3 
              className={`font-medium text-lg text-default-900 ${
                isCompleted ? 'line-through opacity-80' : ''
              } ${
                isMissed ? 'opacity-70' : ''
              } ${
                isSkipped ? 'opacity-75' : ''
              } ${
                isImmutable ? 'opacity-75' : ''
              }`}
            >
              {task.title}
            </h3>
          </div>
          {task.description && (
            <p className={`text-default-600 mt-1 pl-5 ${
              isCompleted ? 'opacity-80' : ''
            } ${
              isMissed ? 'opacity-70' : ''
            } ${
              isSkipped ? 'opacity-75' : ''
            } ${
              isImmutable ? 'opacity-75' : ''
            }`}>
              {task.description}
            </p>
          )}
        </div>
        
        <div>
          {isImmutable ? (
            <div className="flex items-center text-slate-500">
              <Lock className="w-4 h-4 mr-1" />
              <span className="text-sm">Locked</span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center text-green-500 group-hover:invisible">
              <CheckCircle className="w-5 h-5 mr-1" />
              <span className="text-sm">Completed</span>
            </div>
          ) : isMissed ? (
            <div className="flex items-center text-gray-500 group-hover:invisible">
              <XCircle className="w-5 h-5 mr-1" />
              <span className="text-sm">Missed</span>
            </div>
          ) : isSkipped ? (
            <div className="flex items-center text-amber-600">
              <SkipForward className="w-5 h-5 mr-1" />
              <span className="text-sm">Skipped</span>
            </div>
          ) : !isHistorical && onComplete && onMissed ? (
            <div className="flex gap-2">
              <Button 
                onClick={() => onComplete(task.id)}
                size="sm" 
                variant="flat"
                style={{
                  color: primaryWellnessColor,
                  borderColor: primaryWellnessColor
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
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TaskCard; 