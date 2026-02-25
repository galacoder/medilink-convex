/**
 * Bang gia credit AI / AI credit cost table.
 *
 * WHY: Every AI feature has a fixed credit cost. These are constants,
 * not configurable per-org (Phase 1). The cost table determines how many
 * credits are deducted before each Claude API call.
 *
 * vi: "Bang gia credit cho cac tinh nang AI"
 * en: "Credit pricing table for AI features"
 */

// Bang gia credit AI / AI credit cost table
export const AI_CREDIT_COSTS = {
  equipment_diagnosis: {
    credits: 5,
    model: "claude-sonnet-4-5",
    description: "Equipment diagnosis from photo/text",
    descriptionVi: "Chan doan thiet bi tu anh/van ban",
  },
  report_generation: {
    credits: 10,
    model: "claude-sonnet-4-5",
    description: "Auto-generate compliance/audit report",
    descriptionVi: "Tu dong tao bao cao tuan thu/kiem toan",
  },
  manual_search: {
    credits: 1,
    model: "claude-haiku-4-5",
    description: "Search equipment manuals and protocols",
    descriptionVi: "Tim kiem tai lieu huong dan thiet bi",
  },
  maintenance_prediction: {
    credits: 3,
    model: "claude-haiku-4-5",
    description: "Predict maintenance needs from usage history",
    descriptionVi: "Du doan nhu cau bao tri tu lich su su dung",
  },
  training_material: {
    credits: 8,
    model: "claude-sonnet-4-5",
    description: "Generate staff training content",
    descriptionVi: "Tao noi dung dao tao nhan vien",
  },
  inventory_optimization: {
    credits: 15,
    model: "claude-sonnet-4-5",
    description: "Analyze usage and suggest procurement",
    descriptionVi: "Phan tich su dung va de xuat mua sam",
  },
} as const;

export type AiFeatureId = keyof typeof AI_CREDIT_COSTS;

/**
 * Monthly AI credit allocation by subscription plan.
 * vi: "Credit AI hang thang theo goi" / en: "Monthly AI credits by plan"
 */
export const MONTHLY_CREDITS_BY_PLAN = {
  trial: 20,
  starter: 50,
  professional: 200,
  enterprise: 500,
} as const;

export type SubscriptionPlan = keyof typeof MONTHLY_CREDITS_BY_PLAN;
