import type { Doc, Id } from "convex/_generated/dataModel";

// Equipment document type from Convex
export type Equipment = Doc<"equipment">;
export type EquipmentId = Id<"equipment">;

// Equipment with joined category
export interface EquipmentWithCategory extends Equipment {
  category?: {
    _id: Id<"equipmentCategories">;
    nameVi: string;
    nameEn: string;
  } | null;
}

// Filter state for equipment list
export interface EquipmentFilters {
  status?: Equipment["status"];
  categoryId?: Id<"equipmentCategories">;
  search?: string;
}
