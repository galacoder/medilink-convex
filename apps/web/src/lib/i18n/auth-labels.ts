/**
 * Bilingual auth form labels (Vietnamese primary, English secondary).
 *
 * WHY: All UI text must support both Vietnamese and English per project
 * requirements. Vietnamese is the primary language for SPMET Healthcare School.
 */
export const authLabels = {
  signIn: {
    title: { vi: "Đăng nhập", en: "Sign In" },
    subtitle: {
      vi: "Chào mừng trở lại MediLink",
      en: "Welcome back to MediLink",
    },
    email: { vi: "Email", en: "Email" },
    password: { vi: "Mật khẩu", en: "Password" },
    submit: { vi: "Đăng nhập", en: "Sign In" },
    noAccount: { vi: "Chưa có tài khoản?", en: "Don't have an account?" },
    signUpLink: { vi: "Đăng ký", en: "Sign up" },
    loading: { vi: "Đang đăng nhập...", en: "Signing in..." },
    errorGeneric: {
      vi: "Đăng nhập thất bại. Vui lòng thử lại.",
      en: "Sign in failed. Please try again.",
    },
  },
  signUp: {
    title: { vi: "Đăng ký tài khoản", en: "Create Account" },
    subtitle: {
      vi: "Tạo tài khoản MediLink cho tổ chức của bạn",
      en: "Create a MediLink account for your organization",
    },
    name: { vi: "Họ và tên", en: "Full Name" },
    email: { vi: "Email", en: "Email" },
    password: { vi: "Mật khẩu", en: "Password" },
    orgType: { vi: "Loại tổ chức", en: "Organization Type" },
    orgName: { vi: "Tên tổ chức", en: "Organization Name" },
    hospital: {
      vi: "Bệnh viện / Cơ sở y tế",
      en: "Hospital / Healthcare Facility",
    },
    provider: {
      vi: "Nhà cung cấp thiết bị y tế",
      en: "Medical Equipment Provider",
    },
    submit: { vi: "Đăng ký", en: "Sign Up" },
    hasAccount: { vi: "Đã có tài khoản?", en: "Already have an account?" },
    signInLink: { vi: "Đăng nhập", en: "Sign in" },
    loading: { vi: "Đang đăng ký...", en: "Signing up..." },
    errorGeneric: {
      vi: "Đăng ký thất bại. Vui lòng thử lại.",
      en: "Sign up failed. Please try again.",
    },
  },
} as const;

export type AuthLabels = typeof authLabels;
