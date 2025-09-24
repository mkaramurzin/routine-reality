import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { CheckCircle, XCircle, RotateCcw, SkipForward, Lock, Trash2, Flag } from "lucide-react";
import { getTaskColors, WELLNESS_COLORS, type WellnessCategory } from "@/lib/wellnessColors";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed" | "missed" | "skipped";
  wellnessCategories?: WellnessCategory[]; // New wellness categories array
  categoryColor?: string; // Keep for backward compatibility
  routineTitle?: string; // For identifying custom tasks
  routineId?: string; // For identifying custom tasks
  stageProgression?: boolean;
  stageNumber?: number;
  stageAdvancedAt?: string;
}

interface TaskCardProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  onMissed?: (taskId: string) => void; // New prop for missed action
  onUndo?: (taskId: string) => void; // New prop for undoing a task status
  onDelete?: (taskId: string) => void; // New prop for deleting custom tasks
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
  onDelete,
  currentTheme = "dark",
  isHistorical = false,
  isImmutable = false,
  stageNumber
}) => {
  const isCompleted = task.status === "completed";
  const isMissed = task.status === "missed";
  const isSkipped = task.status === "skipped";
  const isStageProgression = task.stageProgression === true;
  
  // Check if this is a custom task
  const isCustomTask = task.routineTitle === "Custom Tasks";
  
  // State for color-coding preference
  const [isColorCodingEnabled, setIsColorCodingEnabled] = useState(false);

  // Load color-coding preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('wellnessColorCoding');
    setIsColorCodingEnabled(savedPreference === 'true');

    // Listen for color-coding preference changes
    const handleColorCodingChange = (event: CustomEvent) => {
      setIsColorCodingEnabled(event.detail.enabled);
    };

    window.addEventListener('wellnessColorCodingChanged', handleColorCodingChange as EventListener);

    return () => {
      window.removeEventListener('wellnessColorCodingChanged', handleColorCodingChange as EventListener);
    };
  }, []);
  
  // Get wellness category colors or fallback to legacy categoryColor or default
  const wellnessColors = getTaskColors(task.wellnessCategories || []);
  const cardColor = task.categoryColor || "#1E90FF"; // Fallback for backward compatibility
  const primaryWellnessColor = task.wellnessCategories && task.wellnessCategories.length > 0 
    ? WELLNESS_COLORS[task.wellnessCategories[0]] 
    : cardColor;
  
  // Calculate background color based on theme and status
  const getBgStyle = (): StyleProps => {
    // If color coding is disabled, use neutral colors
    if (!isColorCodingEnabled) {
      let neutralStyles = currentTheme === "light" 
        ? {
            background: `linear-gradient(to right, #f1f5f915, #f1f5f908)`,
            borderColor: `#e4e4e730`,
            boxShadow: `0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)`,
            borderLeft: `4px solid #e4e4e7`
          }
        : {
            background: `linear-gradient(to right, #27272a15, #27272a08)`,
            borderColor: `#3f3f4640`,
            boxShadow: `0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1)`,
            borderLeft: `4px solid #3f3f46`
          };

      // Special styling for immutable tasks
      if (isImmutable) {
        return {
          ...neutralStyles,
          opacity: 0.6,
          background: currentTheme === "light"
            ? `linear-gradient(to right, #64748b08, #64748b03)`
            : `linear-gradient(to right, #64748b12, #64748b06)`,
          borderLeft: `4px solid #64748b`,
          borderColor: currentTheme === "light" ? "#64748b30" : "#64748b40"
        };
      }
            
      // Modify styles based on status
      if (isCompleted) {
        return {
          ...neutralStyles,
          opacity: 0.85,
          borderLeft: `4px solid #22c55e80`
        };
      }
      
      if (isMissed) {
        return {
          ...neutralStyles,
          opacity: 0.7,
          background: currentTheme === "light"
            ? `linear-gradient(to right, #88888808, #88888803)`
            : `linear-gradient(to right, #88888812, #88888806)`,
          borderLeft: `4px solid #888888`
        };
      }

      if (isSkipped) {
        return {
          ...neutralStyles,
          opacity: 0.6,
          background: currentTheme === "light"
            ? `linear-gradient(to right, #f59e0b08, #f59e0b03)`
            : `linear-gradient(to right, #f59e0b12, #f59e0b06)`,
          borderLeft: `4px solid #f59e0b`
        };
      }
      
      return neutralStyles;
    }

    // Original color coding logic when enabled
    // Use wellness categories if available
    if (task.wellnessCategories && task.wellnessCategories.length > 0) {
      // For single category - subtle colored background
      if (task.wellnessCategories.length === 1) {
        let baseStyles = currentTheme === "light" 
          ? {
              background: `linear-gradient(to right, ${primaryWellnessColor}08, ${primaryWellnessColor}03)`,
              borderColor: `${primaryWellnessColor}30`,
              boxShadow: `0 4px 6px -1px ${primaryWellnessColor}10, 0 2px 4px -1px ${primaryWellnessColor}05`,
              borderLeft: `4px solid ${primaryWellnessColor}`
            }
          : {
              background: `linear-gradient(to right, ${primaryWellnessColor}12, ${primaryWellnessColor}06)`,
              borderColor: `${primaryWellnessColor}40`,
              boxShadow: `0 4px 6px -1px ${primaryWellnessColor}20, 0 2px 4px -1px ${primaryWellnessColor}10`,
              borderLeft: `4px solid ${primaryWellnessColor}`
            };

        // Special styling for immutable tasks
        if (isImmutable) {
          return {
            ...baseStyles,
            opacity: 0.6,
            background: currentTheme === "light"
              ? `linear-gradient(to right, #64748b08, #64748b03)`
              : `linear-gradient(to right, #64748b12, #64748b06)`,
            borderLeft: `4px solid #64748b`,
            borderColor: currentTheme === "light" ? "#64748b30" : "#64748b40"
          };
        }
              
        // Modify styles based on status
        if (isCompleted) {
          return {
            ...baseStyles,
            opacity: 0.85,
            borderLeft: `4px solid ${primaryWellnessColor}80`
          };
        }
        
        if (isMissed) {
          return {
            ...baseStyles,
            opacity: 0.7,
            background: currentTheme === "light"
              ? `linear-gradient(to right, #88888808, #88888803)`
              : `linear-gradient(to right, #88888812, #88888806)`,
            borderLeft: `4px solid #888888`
          };
        }

        if (isSkipped) {
          return {
            ...baseStyles,
            opacity: 0.6,
            background: currentTheme === "light"
              ? `linear-gradient(to right, #f59e0b08, #f59e0b03)`
              : `linear-gradient(to right, #f59e0b12, #f59e0b06)`,
            borderLeft: `4px solid #f59e0b`
          };
        }
        
        return baseStyles;
      }

      // For dual categories - split diagonal background
      if (task.wellnessCategories.length === 2) {
        const color1 = WELLNESS_COLORS[task.wellnessCategories[0]];
        const color2 = WELLNESS_COLORS[task.wellnessCategories[1]];
        
        let baseStyles = currentTheme === "light" 
          ? {
              backgroundImage: `linear-gradient(135deg, ${color1}08 50%, ${color2}08 50%)`,
              borderColor: `${color1}30`,
              boxShadow: `0 4px 6px -1px ${color1}10, 0 2px 4px -1px ${color2}10`,
              borderLeft: `4px solid transparent`,
              background: `linear-gradient(135deg, ${color1} 50%, ${color2} 50%) border-box`,
            }
          : {
              backgroundImage: `linear-gradient(135deg, ${color1}12 50%, ${color2}12 50%)`,
              borderColor: `${color1}40`,
              boxShadow: `0 4px 6px -1px ${color1}20, 0 2px 4px -1px ${color2}20`,
              borderLeft: `4px solid transparent`,
              background: `linear-gradient(135deg, ${color1} 50%, ${color2} 50%) border-box`,
            };

        // Special styling for immutable tasks
        if (isImmutable) {
          return {
            ...baseStyles,
            opacity: 0.6,
            backgroundImage: currentTheme === "light"
              ? `linear-gradient(135deg, #64748b08 50%, #64748b08 50%)`
              : `linear-gradient(135deg, #64748b12 50%, #64748b12 50%)`,
            borderLeft: `4px solid #64748b`,
            borderColor: currentTheme === "light" ? "#64748b30" : "#64748b40"
          };
        }
              
        // Modify styles based on status
        if (isCompleted) {
          return {
            ...baseStyles,
            opacity: 0.85,
          };
        }
        
        if (isMissed) {
          return {
            ...baseStyles,
            opacity: 0.7,
            backgroundImage: currentTheme === "light"
              ? `linear-gradient(135deg, #88888808 50%, #88888808 50%)`
              : `linear-gradient(135deg, #88888812 50%, #88888812 50%)`,
            borderLeft: `4px solid #888888`
          };
        }

        if (isSkipped) {
          return {
            ...baseStyles,
            opacity: 0.6,
            backgroundImage: currentTheme === "light"
              ? `linear-gradient(135deg, #f59e0b08 50%, #f59e0b08 50%)`
              : `linear-gradient(135deg, #f59e0b12 50%, #f59e0b12 50%)`,
            borderLeft: `4px solid #f59e0b`
          };
        }
        
        return baseStyles;
      }
    }

    // Fallback to legacy color system (when color coding enabled but no wellness categories)
    let baseStyles = currentTheme === "light" 
      ? {
          background: `linear-gradient(to right, ${cardColor}08, ${cardColor}03)`,
          borderColor: `${cardColor}30`,
          boxShadow: `0 4px 6px -1px ${cardColor}10, 0 2px 4px -1px ${cardColor}05`,
          borderLeft: `4px solid ${cardColor}`
        }
      : {
          background: `linear-gradient(to right, ${cardColor}12, ${cardColor}06)`,
          borderColor: `${cardColor}40`,
          boxShadow: `0 4px 6px -1px ${cardColor}20, 0 2px 4px -1px ${cardColor}10`,
          borderLeft: `4px solid ${cardColor}`
        };

    // Special styling for immutable tasks
    if (isImmutable) {
      return {
        ...baseStyles,
        opacity: 0.6,
        background: currentTheme === "light"
          ? `linear-gradient(to right, #64748b08, #64748b03)`
          : `linear-gradient(to right, #64748b12, #64748b06)`,
        borderLeft: `4px solid #64748b`,
        borderColor: currentTheme === "light" ? "#64748b30" : "#64748b40"
      };
    }
        
    // Modify styles based on status
    if (isCompleted) {
      return {
        ...baseStyles,
        opacity: 0.85,
        background: currentTheme === "light" 
          ? `linear-gradient(to right, ${cardColor}06, ${cardColor}03)`
          : `linear-gradient(to right, ${cardColor}10, ${cardColor}06)`,
        borderLeft: `4px solid ${cardColor}80`
      };
    }
    
    if (isMissed) {
      return {
        ...baseStyles,
        opacity: 0.7,
        background: currentTheme === "light"
          ? `linear-gradient(to right, #88888808, #88888803)`
          : `linear-gradient(to right, #88888812, #88888806)`,
        borderLeft: `4px solid #888888`
      };
    }

    if (isSkipped) {
      return {
        ...baseStyles,
        opacity: 0.6,
        background: currentTheme === "light"
          ? `linear-gradient(to right, #f59e0b08, #f59e0b03)`
          : `linear-gradient(to right, #f59e0b12, #f59e0b06)`,
        borderLeft: `4px solid #f59e0b`
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
                backgroundColor: !isCompleted && !isMissed && !isSkipped && !isImmutable && isColorCodingEnabled
                  ? primaryWellnessColor
                  : !isCompleted && !isMissed && !isSkipped && !isImmutable && !isColorCodingEnabled
                  ? (currentTheme === "light" ? "#e4e4e7" : "#3f3f46")
                  : undefined
              }}
            ></div>
            <h3
              className={`font-medium text-lg text-default-900 ${
                isCompleted && !isStageProgression ? 'line-through opacity-80' : ''
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
            {isStageProgression && task.stageNumber && (
              <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-primary-600 bg-primary-100 dark:bg-primary-900/40 px-2 py-0.5 rounded-full">
                Stage {task.stageNumber}
              </span>
            )}
          </div>
          {task.description && (
            <p className={`text-default-600 mt-1 pl-5 ${
              isCompleted && !isStageProgression ? 'opacity-80' : ''
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
            <div
              className={`flex items-center ${
                isStageProgression ? "text-primary-500" : "text-green-500"
              } ${
                isStageProgression ? "" : "group-hover:invisible"
              }`}
            >
              {isStageProgression ? (
                <Flag className="w-5 h-5 mr-1" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-1" />
              )}
              <span className="text-sm">
                {isStageProgression ? "Stage progression" : "Completed"}
              </span>
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
                  color: isColorCodingEnabled ? primaryWellnessColor : (currentTheme === "light" ? "#3f3f46" : "#d4d4d8"),
                  borderColor: isColorCodingEnabled ? primaryWellnessColor : (currentTheme === "light" ? "#e4e4e7" : "#3f3f46")
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
              {isCustomTask && onDelete && (
                <Button 
                  onClick={() => onDelete(task.id)}
                  size="sm" 
                  variant="flat"
                  className="text-red-500 border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  title="Delete this custom task"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TaskCard; 