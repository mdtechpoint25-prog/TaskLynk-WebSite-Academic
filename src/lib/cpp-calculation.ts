/**
 * CPP (Content Production Payment) Level System
 * Freelancers progress through levels based on completed orders
 * Each level has different CPP rates for technical and non-technical work
 */

export interface CPPLevel {
  level: number;
  levelName: string;
  description: string;
  completedOrdersRequired: number;
  cppNonTechnical: number;
  cppTechnical: number;
  orderCountInLevel: number;
  progressBarColor: string;
}

export interface FreelancerCPPStatus {
  currentLevel: number;
  totalCompletedOrders: number;
  ordersInCurrentLevel: number;
  progressPercentage: number;
  nextLevelOrdersRequired: number;
  currentCPP: number;
  nextLevelCPP: number;
  isWorkTypeSpecialized: boolean;
}

// CPP Level Definitions
// Non-technical baseline, Technical adds 20 to each
export const CPP_LEVELS: CPPLevel[] = [
  {
    level: 1,
    levelName: 'Starter',
    description: 'Beginning your journey with us',
    completedOrdersRequired: 0,
    cppNonTechnical: 150,
    cppTechnical: 170, // 150 + 20
    orderCountInLevel: 3,
    progressBarColor: '#10b981', // Emerald green
  },
  {
    level: 2,
    levelName: 'Rising',
    description: 'Showing consistent quality work',
    completedOrdersRequired: 3,
    cppNonTechnical: 160,
    cppTechnical: 180, // 160 + 20
    orderCountInLevel: 5,
    progressBarColor: '#06b6d4', // Cyan
  },
  {
    level: 3,
    levelName: 'Established',
    description: 'Building a strong reputation',
    completedOrdersRequired: 8,
    cppNonTechnical: 170,
    cppTechnical: 190, // 170 + 20
    orderCountInLevel: 15,
    progressBarColor: '#3b82f6', // Blue
  },
  {
    level: 4,
    levelName: 'Expert',
    description: 'Trusted by many clients',
    completedOrdersRequired: 23,
    cppNonTechnical: 180,
    cppTechnical: 200, // 180 + 20
    orderCountInLevel: 27,
    progressBarColor: '#8b5cf6', // Violet
  },
  {
    level: 5,
    levelName: 'Master',
    description: 'Excellence in every project',
    completedOrdersRequired: 50,
    cppNonTechnical: 200,
    cppTechnical: 220, // 200 + 20
    orderCountInLevel: Infinity, // No progression beyond this
    progressBarColor: '#fbbf24', // Amber (Master tier)
  },
];

/**
 * Get CPP level by order count
 */
export function getCPPLevelByOrderCount(completedOrders: number): CPPLevel {
  const level = CPP_LEVELS.find((l) => l.completedOrdersRequired <= completedOrders) ||
    CPP_LEVELS[0];
  return level;
}

/**
 * Get current CPP rate based on completed orders and work type
 */
export function getCurrentCPP(
  completedOrders: number,
  isWorkTypeSpecialized: boolean
): number {
  const level = getCPPLevelByOrderCount(completedOrders);
  return isWorkTypeSpecialized ? level.cppTechnical : level.cppNonTechnical;
}

/**
 * Get next CPP level and calculate progress
 */
export function calculateCPPProgress(
  completedOrders: number,
  isWorkTypeSpecialized: boolean
): FreelancerCPPStatus {
  const currentLevelData = getCPPLevelByOrderCount(completedOrders);
  const currentLevel = currentLevelData.level;
  const nextLevelData = CPP_LEVELS[currentLevel < CPP_LEVELS.length ? currentLevel : CPP_LEVELS.length - 1];
  
  // For Master tier, no progression
  if (currentLevel === CPP_LEVELS.length) {
    return {
      currentLevel: currentLevel,
      totalCompletedOrders: completedOrders,
      ordersInCurrentLevel: completedOrders - currentLevelData.completedOrdersRequired,
      progressPercentage: 100,
      nextLevelOrdersRequired: 0,
      currentCPP: getCurrentCPP(completedOrders, isWorkTypeSpecialized),
      nextLevelCPP: getCurrentCPP(completedOrders, isWorkTypeSpecialized),
      isWorkTypeSpecialized,
    };
  }

  // Calculate progress to next level
  const ordersInCurrentLevel = completedOrders - currentLevelData.completedOrdersRequired;
  const ordersNeededForNext = nextLevelData.completedOrdersRequired - currentLevelData.completedOrdersRequired;
  const progressPercentage = (ordersInCurrentLevel / ordersNeededForNext) * 100;

  return {
    currentLevel: currentLevel,
    totalCompletedOrders: completedOrders,
    ordersInCurrentLevel: ordersInCurrentLevel,
    progressPercentage: Math.min(progressPercentage, 100),
    nextLevelOrdersRequired: Math.max(0, ordersNeededForNext - ordersInCurrentLevel),
    currentCPP: getCurrentCPP(completedOrders, isWorkTypeSpecialized),
    nextLevelCPP: getCurrentCPP(nextLevelData.completedOrdersRequired, isWorkTypeSpecialized),
    isWorkTypeSpecialized,
  };
}

/**
 * Get CPP level details with all information
 */
export function getCPPLevelDetails(level: number): CPPLevel | null {
  return CPP_LEVELS.find((l) => l.level === level) || null;
}

/**
 * Get all CPP levels (for display purposes)
 */
export function getAllCPPLevels(): CPPLevel[] {
  return CPP_LEVELS;
}

/**
 * Calculate expected CPP at a given order count
 */
export function getExpectedCPP(
  targetOrderCount: number,
  isWorkTypeSpecialized: boolean
): { level: CPPLevel; cpp: number } {
  const level = getCPPLevelByOrderCount(targetOrderCount);
  const cpp = isWorkTypeSpecialized ? level.cppTechnical : level.cppNonTechnical;
  return { level, cpp };
}

/**
 * Get completion status message
 */
export function getCPPStatusMessage(status: FreelancerCPPStatus): string {
  const current = getCPPLevelByOrderCount(status.totalCompletedOrders);
  
  if (status.nextLevelOrdersRequired === 0) {
    return `🏆 You've reached Master tier! Enjoy CPP ${status.currentCPP} for all your work.`;
  }
  
  return `${status.ordersInCurrentLevel}/${status.ordersInCurrentLevel + status.nextLevelOrdersRequired} orders completed in ${current.levelName} tier. ${status.nextLevelOrdersRequired} more to advance!`;
}

/**
 * Determine if work type is technical
 */
export function isWorkTypeTechnical(workType: string): boolean {
  const technicalTypes = [
    'data-analysis',
    'programming',
    'web-development',
    'software-design',
    'technical-writing',
    'system-design',
  ];
  return technicalTypes.includes(workType.toLowerCase());
}
