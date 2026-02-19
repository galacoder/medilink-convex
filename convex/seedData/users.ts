/**
 * Seed data: Users
 * vi: "Dữ liệu mẫu: Người dùng" / en: "Seed data: Users"
 *
 * 6 users covering all roles:
 *   - 1 platform admin
 *   - 1 hospital owner (Dr.)
 *   - 2 hospital staff members
 *   - 1 provider owner
 *   - 1 provider technician
 */

export interface SeedUser {
  name: string;
  email: string;
  platformRole?: "platform_admin" | "platform_support";
}

// vi: "Quản trị viên nền tảng" / en: "Platform administrator"
export const PLATFORM_ADMIN: SeedUser = {
  name: "Nguyễn Văn Admin",
  email: "admin@medilink.vn",
  platformRole: "platform_admin",
};

// vi: "Chủ sở hữu bệnh viện (Bác sĩ)" / en: "Hospital owner (Doctor)"
export const HOSPITAL_OWNER: SeedUser = {
  name: "Dr. Trần Thị Lan",
  email: "lan.tran@spmet.edu.vn",
};

// vi: "Nhân viên bệnh viện 1" / en: "Hospital staff member 1"
export const HOSPITAL_STAFF_1: SeedUser = {
  name: "Phạm Minh Đức",
  email: "duc.pham@spmet.edu.vn",
};

// vi: "Nhân viên bệnh viện 2" / en: "Hospital staff member 2"
export const HOSPITAL_STAFF_2: SeedUser = {
  name: "Võ Thị Mai",
  email: "mai.vo@spmet.edu.vn",
};

// vi: "Chủ sở hữu nhà cung cấp" / en: "Provider owner"
export const PROVIDER_OWNER: SeedUser = {
  name: "Lê Văn Minh",
  email: "minh.le@techmed.vn",
};

// vi: "Kỹ thuật viên nhà cung cấp" / en: "Provider technician"
export const PROVIDER_TECHNICIAN: SeedUser = {
  name: "Hoàng Đức Anh",
  email: "anh.hoang@techmed.vn",
};

export const ALL_SEED_USERS: SeedUser[] = [
  PLATFORM_ADMIN,
  HOSPITAL_OWNER,
  HOSPITAL_STAFF_1,
  HOSPITAL_STAFF_2,
  PROVIDER_OWNER,
  PROVIDER_TECHNICIAN,
];
