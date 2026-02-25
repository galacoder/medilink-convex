/**
 * AI credit cost table.
 *
 * Fixed credit costs per AI feature. Not configurable per-org in Phase 1.
 * Each entry maps a feature ID to its credit cost, Claude model, and
 * bilingual description.
 *
 * vi: "Bang gia credit AI" / en: "AI credit cost table"
 *
 * @see Issue #174 -- M1-5: AI Credit System
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
 * Monthly AI credit allocations per subscription plan.
 *
 * vi: "Credit AI hang thang theo goi"
 * en: "Monthly AI credits by subscription plan"
 */
export const PLAN_MONTHLY_CREDITS: Record<string, number> = {
  trial: 20,
  starter: 50,
  professional: 200,
  enterprise: 500,
};
