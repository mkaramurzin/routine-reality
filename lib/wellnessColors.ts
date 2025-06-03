/**
 * Wellness Colors Utility
 * 
 * Centralized color system for wellness categories across the application.
 * Used for task backgrounds, routine borders, and legend display.
 */

export type WellnessCategory = 
  | "overall_health"
  | "brainy"
  | "body"
  | "money"
  | "personal_growth"
  | "body_maintenance"
  | "custom";

export const WELLNESS_COLORS: Record<WellnessCategory, string> = {
  overall_health: "#1E90FF",
  brainy: "#FF2D95",
  body: "#E74C3C",
  money: "#1E5C3A",
  personal_growth: "#2ECC71",
  body_maintenance: "#9B59B6",
  custom: "#7F8C8D",
};

export const WELLNESS_DESCRIPTIONS: Record<WellnessCategory, string> = {
  overall_health: "Holistic health and well-being practices",
  brainy: "Mental development and cognitive enhancement",
  body: "Physical fitness and athletic performance",
  money: "Financial planning and wealth building",
  personal_growth: "Self-improvement and life development",
  body_maintenance: "Daily health maintenance and hygiene",
  custom: "Personalized activities and goals",
};

/**
 * Get colors for a task (max 2 categories)
 * Returns single color or gradient for dual colors
 */
export function getTaskColors(categories: WellnessCategory[]): {
  backgroundColor?: string;
  backgroundImage?: string;
} {
  if (categories.length === 0) {
    return {};
  }

  if (categories.length === 1) {
    return {
      backgroundColor: WELLNESS_COLORS[categories[0]],
    };
  }

  // Dual color diagonal gradient
  if (categories.length === 2) {
    return {
      backgroundImage: `linear-gradient(135deg, ${WELLNESS_COLORS[categories[0]]} 50%, ${WELLNESS_COLORS[categories[1]]} 50%)`,
    };
  }

  return {};
}

/**
 * Get border colors for a routine (max 4 categories)
 * Returns border-image or individual border colors
 */
export function getRoutineBorderColors(categories: WellnessCategory[]): {
  borderImage?: string;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
} {
  if (categories.length === 0) {
    return {};
  }

  if (categories.length === 1) {
    const color = WELLNESS_COLORS[categories[0]];
    return {
      borderTopColor: color,
      borderRightColor: color,
      borderBottomColor: color,
      borderLeftColor: color,
    };
  }

  if (categories.length === 2) {
    return {
      borderTopColor: WELLNESS_COLORS[categories[0]],
      borderBottomColor: WELLNESS_COLORS[categories[0]],
      borderRightColor: WELLNESS_COLORS[categories[1]],
      borderLeftColor: WELLNESS_COLORS[categories[1]],
    };
  }

  if (categories.length === 3) {
    return {
      borderTopColor: WELLNESS_COLORS[categories[0]],
      borderRightColor: WELLNESS_COLORS[categories[1]],
      borderBottomColor: WELLNESS_COLORS[categories[2]],
      borderLeftColor: WELLNESS_COLORS[categories[0]], // Repeat first color
    };
  }

  if (categories.length === 4) {
    return {
      borderTopColor: WELLNESS_COLORS[categories[0]],
      borderRightColor: WELLNESS_COLORS[categories[1]],
      borderBottomColor: WELLNESS_COLORS[categories[2]],
      borderLeftColor: WELLNESS_COLORS[categories[3]],
    };
  }

  return {};
}

/**
 * Get Tailwind CSS classes for task styling
 */
export function getTaskTailwindClasses(categories: WellnessCategory[]): string {
  // Since Tailwind doesn't support dynamic colors well, we'll use inline styles
  // This function can be extended if you have a Tailwind config with these colors
  return categories.length > 0 ? "border-2" : "";
}

/**
 * Get Tailwind CSS classes for routine styling  
 */
export function getRoutineTailwindClasses(categories: WellnessCategory[]): string {
  // Since Tailwind doesn't support dynamic colors well, we'll use inline styles
  // This function can be extended if you have a Tailwind config with these colors
  return categories.length > 0 ? "border-4" : "border-2 border-gray-200";
} 